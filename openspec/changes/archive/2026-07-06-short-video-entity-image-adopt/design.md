## Context

短视频资产页（`EntityCard`）当前每个实体仅展示 `entity.assetId` 对应的一张参考图。AI 生图任务完成后，`ShortVideoTaskLinkerService.onTaskCompleted` 会**自动覆盖** `entity.assetId`。用户无法保留多张候选图、无法本地上传、也无法在视频编辑前显式选择参考图。

Asset 表已支持 `source: short_video`，生图完成时 metadata 已写入 `shortVideoProjectId` 与 `shortVideoEntityId`，可作为历史列表的数据源。`uploadReference` 可将文件上传到 OSS，但不会创建 Asset 记录。

## Goals / Non-Goals

**Goals:**

- `entity.assetId` 语义改为**用户采纳**的参考图，供视频编辑 Seedance R2V 使用
- AI 生图 / 本地上传均进入实体历史列表，大图预览可切换，**均需手动采纳**才写入 `assetId`
- 资产页 UI：大图 + 历史缩略图条 + 采纳按钮 + 本地上传
- 新增后端 API：列出实体历史图、采纳、上传绑定

**Non-Goals:**

- 历史图删除（后续迭代）
- 多视角图 Tab
- 实体/片段手动删除
- WebSocket 推送；沿用任务轮询 + 页面 refresh

## Decisions

### 1. 历史数据来源：Asset metadata 查询

**选择**：不扩展 `ParsedEntity` JSON 字段；历史列表通过 Asset 表查询：

```
WHERE userId = ?
  AND source = short_video
  AND type = image
  AND deletedAt IS NULL
  AND metadata.shortVideoProjectId = projectId
  AND metadata.shortVideoEntityId = entityId
ORDER BY createdAt DESC
```

**理由**：metadata 已在生图链路写入；避免 JSON 与 Asset 表双写同步。上传路径同样写入相同 metadata。

**备选**：`entity.imageAssetIds[]` — 更可控但增加 merge/删除复杂度，本期不需要。

### 2. 生图完成：只创建 Asset，不自动 adopt

**选择**：修改 `ShortVideoTaskLinkerService.onTaskCompleted`（image 分支）：任务完成时**仅** persist Asset（已有），**不再**更新 `entity.assetId`。仍更新 `entity.imageTaskId` 以便 UI 跟踪进行中任务。

**理由**：符合「预览新图、手动采纳」产品决策；**BREAKING** 但语义更清晰。

**前端**：任务完成后 reload 历史；若用户未采纳任何图，大图默认预览**最新**历史项（客户端状态 `previewAssetId`，不落库）。

### 3. 采纳 API

**选择**：`POST /short-video/projects/:id/entities/:entityId/adopt-image`，body `{ "assetId": "..." }`。

服务端校验：

- project 归属当前用户
- entity 存在于 parsedEntities
- asset 归属当前用户、`source=short_video`、`type=image`、未删除
- asset.metadata 中 `shortVideoProjectId` 与 `shortVideoEntityId` 匹配

成功后更新 `entity.assetId`（及可选清除 stale `imageTaskId` 若已 done）。

### 4. 本地上传 API

**选择**：`POST /short-video/projects/:id/entities/:entityId/upload-image`，body `{ "ossKey": "...", "mimeType": "..." }`。

流程：前端先调现有 `POST /storage/upload` → 再调 upload-image 创建 Asset（`source: short_video`，metadata 含 projectId/entityId/entityKind/entityName，可选 `uploaded: true`）。

**不自动 adopt**；返回 asset + previewUrl，前端加入历史并设为预览。

**备选**：multipart 单端点 — 复用性差，分两步调已有 upload 更简单。

### 5. 列表 API

**选择**：`GET /short-video/projects/:id/entities/:entityId/images` 返回 `{ items: [{ id, previewUrl, createdAt, adopted: boolean }] }`，其中 `adopted = (id === entity.assetId)`。

项目级批量（可选优化）：`GET .../projects/:id/entity-images` 一次返回所有实体的历史，减少 N+1。MVP 可 per-entity，实体数量通常有限。

### 6. 前端组件拆分

**选择**：重构 `EntityCard` 为上下布局子组件（各 ≤400 行）：

- `EntityImagePreview` — 大图、已采用 badge、采纳按钮（预览项 ≠ assetId 时显示）
- `EntityImageHistory` — 历史条、计数、本地上传、缩略图选中态
- 保留现有 prompt + 生成按钮区域

预览态用组件内 `useState(previewAssetId)`，初始值：有 `assetId` 用 assetId，否则历史最新一条。

### 7. 视频编辑行为不变

**选择**：`generateSegmentVideo` 仍只读 `entity.assetId`。未采纳时该实体视为无参考图，现有 warning 逻辑继续生效。

## Risks / Trade-offs

- **[Risk] 旧项目习惯「生图即绑定」** → 文档与 UI 引导；已采纳的 `assetId` 在 deploy 后仍有效，仅新生图不再自动覆盖
- **[Risk] metadata 查询在 MySQL JSON 上无索引** → MVP 实体/历史量小可接受；后续可加 generated column 或冗余字段
- **[Risk] 预览态与采纳态不一致导致用户困惑** → 大图明确区分「预览中」与「已采用」badge；采纳按钮仅在预览 ≠ assetId 时突出
- **[Trade-off] 无删除** → 历史只增不减，长期可能 clutter；后续加删除

## Migration Plan

1. 部署 API：先改 task linker（停止 auto-adopt），再上新端点
2. 部署 Web：EntityCard 新 UI；api-client 新方法
3. 无需 DB migration；现有 `assetId` 保留为已采纳状态
4. 回滚：恢复 task linker auto-adopt + 旧 UI（新 API 可保留无害）

## Open Questions

（均已由产品确认，无遗留）

- 自动采纳：否
- 上传自动采纳：否
- 多视角：否
- 删除：本期不做
