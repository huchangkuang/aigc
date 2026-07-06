## Why

短视频工作流中，剧本解析、参考图生成、分镜解析等操作耗时较长，但当前 UI 反馈不足：同步 LLM 操作仅有文字切换且 loading 启动偏晚；异步 GenerationTask 操作在任务提交后立即清除 busy 状态，用户点击后几乎看不到「进行中」反馈，体验很差。

## What Changes

- **剧本页**：点击「解析角色/场景/道具」后立即进入 loading（含 spinner），保存剧本与解析在同一 loading 态内完成；HTTP 等待期间禁用操作按钮
- **资产页**：点击「生成参考图」后保持 loading 直至对应 `imageTaskId` 任务完成或失败；预览区显示生成中 overlay；页面 mount 时恢复进行中的生图任务轮询
- **视频编辑页**：点击「解析分镜」后立即 loading + spinner（同步 LLM，同剧本页）；片段「AI 生成」保持 loading 直至 `videoTaskId` 任务完成或失败；mount 时恢复进行中的视频任务轮询
- 抽取可复用的前端 task 轮询逻辑（复用现有 `listActiveTasks` / `hasActiveTasks` 模式，对齐 `/generate` 页）
- 前端 `api-client` 补充 `getGenerationTask(id)` 封装（后端已有 `GET /generation-tasks/:id`）
- **不改动**后端 parse-entities / parse-segments 同步 API（方案 A）

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `short-video-project`: 补充剧本/资产/视频编辑三处 long-running 操作的 loading 与异步任务轮询 UX 要求

## Impact

- **前端** `apps/web/src/app/(workspace)/short-video/[projectId]/script|assets|edit/page.tsx`
- **前端** `apps/web/src/components/entity-card.tsx`、`segment-card.tsx`（预览区 generating overlay）
- **前端** 新增 `apps/web/src/lib/use-generation-task-poll.ts`（或同级 util/hook）
- **前端** `apps/web/src/lib/api-client.ts`：新增 `getGenerationTask`
- **后端**：无变更
- **OpenSpec** `openspec/specs/short-video-project/spec.md`：新增 loading/polling UX requirements
