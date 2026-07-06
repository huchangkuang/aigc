## Context

短视频模块三类操作对应两种后端模式：

| 操作 | 模式 | 现有前端问题 |
|------|------|-------------|
| 解析实体 / 解析分镜 | 同步 HTTP（DeepSeek LLM 阻塞） | `parseEntities` 先 `saveScript` 再 `setParsing`；仅文字无 spinner |
| 生成参考图 / AI 生成视频 | 异步 GenerationTask | `busy` 在 POST 返回后即清除（~100ms），未轮询 `imageTaskId` / `videoTaskId` |

`/generate` 页已有成熟轮询：`listActiveTasks` + 5s interval + `hasActiveTasks`。数据模型已存储 `entity.imageTaskId`、`segment.videoTaskId`，可直接用于恢复与跟踪。

## Goals / Non-Goals

**Goals:**

- 用户点击任一 long-running 操作后，立即看到明确的 loading 反馈（spinner + 禁用按钮）
- 异步任务（生图、生视频）在任务真正完成或失败前保持 loading，完成后自动 refresh 数据
- 页面重新进入时，若存在进行中的 `imageTaskId` / `videoTaskId`，自动恢复 loading 并继续轮询
- 复用现有 generation task API，不引入新依赖

**Non-Goals:**

- 将 parse-entities / parse-segments 改为后端异步 job（方案 B）
- 全局 task dock / toast 进度条（可后续迭代）
- 后端 API 或数据模型变更

## Decisions

### 1. 同步 LLM 操作：加强 HTTP 等待态，不轮询

**选择**：剧本解析、分镜解析保持现有 POST 同步 API；前端在点击瞬间 `setParsing(true)`，合并 save + parse 于同一 loading 态，按钮显示 `progress_activity` spinner。

**理由**：后端已阻塞至 LLM 完成，轮询 project 无额外价值；改动最小。

**备选**：后端异步化 + 轮询 project — 工作量大，留作后续若遇 HTTP 超时再考虑。

### 2. 异步任务轮询：薄 hook + `listActiveTasks`

**选择**：新增 `useGenerationTaskPoll({ taskIds, onSettled })`：

```
mount / taskIds 变化
    │
    ▼
filter taskIds 中 status ∈ {pending, processing}（via listActiveTasks）
    │
    ▼
有 active → setInterval 5s poll listActiveTasks
    │
    ▼
全部 settled (done|failed) → onSettled() → 父组件 reload
```

**理由**：与 `/generate` 一致；`listActiveTasks` 已存在且轻量；无需为每个 taskId 单独 GET。

**备选**：逐个 `GET /generation-tasks/:id` — 请求数多，仅在 listActive 不够用时的 fallback。仍补充 `getGenerationTask` 供单 task 查询与测试 mock。

### 3. busy 状态来源：本地 submitting + 远程 task active

资产页 / 编辑页每个 item 的 generating 态 = `busyId === entityId`（提交中）**或** `imageTaskId`/`videoTaskId` 对应任务仍 active（轮询中）。

页面层维护 `pendingTaskIds: Set<string>`，submit 时加入，poll settled 后移除并 reload。

### 4. UI：按钮 spinner + 预览区 overlay

**选择**：

- 按钮：复用 `Icon name="progress_activity" className="animate-spin"`（与 `generation-composer` 一致）
- 预览区：`EntityImagePreview` / `SegmentCard` 视频占位增加 `generating` prop，半透明 overlay + spinner

**理由**：仅改按钮文字在卡片布局中不够显眼；overlay 让用户知道「这张图/视频正在生成」。

### 5. 轮询间隔：5000ms

与 `generate/page.tsx` 的 `TASK_POLL_INTERVAL_MS` 保持一致，提取为共享常量 `GENERATION_TASK_POLL_INTERVAL_MS`（可放在 `generation-output.ts` 或 hook 文件内）。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| `listActiveTasks` 返回用户全部 active 任务，需按 taskId 过滤 | 页面只关心自身 `imageTaskId`/`videoTaskId` 集合，filter 后判断 |
| 用户离开页面再回来，task 已完成但 UI 未 refresh | mount 时 scan project 中 taskId，若已 done 则直接 reload 一次 |
| 任务 failed 无 toast | `onSettled` 内检查 failed status，调用 `toast` 提示 |
| parse 期间用户编辑 textarea | parsing 时 disable textarea 与解析按钮 |

## Migration Plan

纯前端变更，部署后即生效。无数据迁移。rollback = revert 前端 commit。

## Open Questions

（无 — 方案 A 范围已明确）
