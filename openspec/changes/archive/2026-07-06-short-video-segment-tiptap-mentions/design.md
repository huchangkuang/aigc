## Context

视频编辑页（`SegmentCard` + `edit/page.tsx`）当前：

- `seedancePrompt` 为只读 textarea，来自 DeepSeek 分镜解析
- `generateSegmentVideo` 仅接收 `model`；后端根据 `characterRefIds/sceneRefId/propRefIds` 查找 `entity.assetId` 自动注入 `image_urls`
- UI 显示「部分参考图缺失」当分镜关联实体未采纳参考图

资产页已实现实体参考图采纳（`entity.assetId`）。用户希望在编辑页通过 `@` 手动引用**已采纳**的实体图，完全废弃隐式自动带图。

产品决策（已确认）：

1. `@` 范围：本项目实体图，**仅已采纳**（`entity.assetId`）
2. 完全废弃旧自动带图逻辑（无 fallback）
3. 解析分镜后不预填 `@`
4. 编辑器失焦保存

## Goals / Non-Goals

**Goals:**

- Tiptap 编辑器替换只读 textarea，支持 `@` mention 下拉
- 生成视频时使用编辑器提取的 plain text prompt + 用户选中的 `assetIds`
- 失焦时持久化编辑器状态到 segment JSON
- 移除「部分参考图缺失」UI

**Non-Goals:**

- 引用未采纳的历史图、全局资产库跨项目图
- 解析时自动插入 `@` mention
- 视频/音频参考（Seedance R2V 多模态中的 video/audio 引用）
- TipTap 富文本格式（加粗、标题等）；仅段落文本 + mention inline nodes

## Decisions

### 1. Segment JSON 扩展

**选择**：在 `Segment` 类型新增：

```typescript
referenceAssetIds?: string[];   // @ 选中的 asset id，有序、去重
seedancePromptDoc?: object;     // Tiptap JSONDocument，保留 mention  inline 位置
```

`seedancePrompt` 保留为 plain text（从 doc 提取，mention 节点替换为空或实体名），供 Seedance API 与列表展示。

失焦保存写入三者：`seedancePrompt`、`referenceAssetIds`、`seedancePromptDoc`。

**理由**：Tiptap doc 保留 mention 在文本中的位置；plain text + assetIds 便于后端 generate 与测试。

**备选**：仅存 `seedancePromptDoc` — 后端需解析 Tiptap JSON，增加耦合。

### 2. 持久化 API

**选择**：`PATCH /short-video/projects/:id/segments/:segmentId`

Body:

```json
{
  "seedancePrompt": "...",
  "referenceAssetIds": ["asset-1", "asset-2"],
  "seedancePromptDoc": { "type": "doc", "content": [...] }
}
```

校验：project 归属、segment 存在、`referenceAssetIds` 中每个 asset 必须是当前项目某实体的已采纳 `assetId`（`source=short_video`, `type=image`）。

**理由**：独立 PATCH 比整项目 PATCH 更精确；失焦触发，频率可控。

### 3. @ 下拉数据源 API

**选择**：`GET /short-video/projects/:id/adopted-entity-images`

返回：

```json
{
  "items": [
    {
      "assetId": "...",
      "entityId": "...",
      "entityName": "陆远",
      "entityKind": "character",
      "previewUrl": "..."
    }
  ]
}
```

实现：遍历 `parsedEntities` 中 `assetId` 有值的实体，批量查 Asset + 签名 URL。

**理由**：单次请求、语义清晰；比前端 N 次 `listEntityImages` 更简单。

**备选**：前端从 project.parsedEntities + assets 列表本地组装 — 可行但 edit 页需额外 asset 查询与 entity 映射逻辑。

### 4. generateSegmentVideo 改造

**选择**：扩展 `GenerateSegmentVideoDto`：

```typescript
{
  model?: string;
  prompt: string;        // required from client (editor plain text)
  assetIds?: string[];   // optional, from editor mentions
}
```

后端逻辑：

1. **删除** `characterRefIds/sceneRefId/propRefIds` → `entity.assetId` 自动收集
2. 校验 `assetIds` 均为项目已采纳实体图（同 PATCH 校验）
3. 解析为 signed `image_urls`（上限 14，与 `/generate` 一致）
4. 创建 `video_seedance_r2v` task
5. 同时写回 segment 的 `seedancePrompt`、`referenceAssetIds`、`model`（与 PATCH 一致，保证生成前最后一次编辑已落库）

**BREAKING**：旧客户端只传 `model` 将不再有效（需传 `prompt`）。MVP 前后端同 deploy。

### 5. Tiptap 组件结构

**选择**：

- `SegmentPromptEditor` — Tiptap 实例、mention suggestion、onBlur 回调（≤400 行）
- `AssetMentionList` — `@` 下拉 UI（缩略图 + 实体名 + kind 标签）
- 自定义 `AssetMention` extension（attrs: `assetId`, `label`, `previewUrl`）

依赖（新增至 `apps/web`）：

- `@tiptap/react`
- `@tiptap/starter-kit`（仅 `Document`, `Paragraph`, `Text`）
- `@tiptap/extension-mention`
- `@tiptap/suggestion`

编辑器初始内容：

- 有 `seedancePromptDoc` → 从 JSON 恢复
- 否则 → 单段落纯文本 `seedancePrompt`（解析后默认，**无** `@` 预填）

**提取逻辑**（generate 与 blur 共用 util）：

```typescript
// plain text: 遍历 doc，mention 节点跳过或替换为 label
// assetIds: 按 doc 顺序收集 mention.attrs.assetId，去重
```

### 6. 移除 warning

**选择**：删除 `SegmentCard` 中 `missingRefs` prop/badge；删除 `edit/page.tsx` 中 `segmentMissingRefs` 函数及相关测试断言。

Spec 中 REMOVED「Generate without reference images」的 UI warning scenario。

### 7. 与 entity adopt 的关系

**选择**：资产页「采纳」决定某图是否出现在 `@` 下拉；视频编辑**不再**读取分镜 `characterRefIds` 决定参考图。分镜 refIds 仍保留为 DeepSeek 解析 metadata（场景描述上下文），不参与生视频。

## Risks / Trade-offs

- **[Risk] 新依赖 Tiptap 包体积** → 仅 import 必要 extension；SegmentPromptEditor 独立 chunk
- **[Risk] 失焦保存与用户点击「AI 生成」竞态** → 生成前先 await 当前 blur save 或 generate 按钮读取 editor 最新 state 并同步 PATCH
- **[Risk] 未 @ 任何图时纯文生视频** → 允许；Seedance R2V 支持无 reference_image
- **[Trade-off] 只能 @ 已采纳图** → 用户须先在资产页采纳；符合产品决策
- **[BREAKING] 旧 segment 无 seedancePromptDoc** → 回退到 plain seedancePrompt 初始化，行为可接受

## Migration Plan

1. 部署 API：新增 PATCH + adopted-entity-images；扩展 generate-video（接受 prompt/assetIds）
2. 部署 Web：Tiptap 编辑器 + 移除 warning
3. 无需 DB migration（segment JSON 字段向后兼容）
4. 回滚：恢复旧 generateSegmentVideo 隐式带图 + textarea（新 PATCH 端点可保留）

## Open Questions

（均已由产品确认，无遗留）

- `@` 范围：本项目已采纳实体图
- 自动带图：完全废弃
- 预填 `@`：否
- 持久化：失焦保存
