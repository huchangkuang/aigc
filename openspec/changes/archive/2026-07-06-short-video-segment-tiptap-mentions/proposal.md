## Why

视频编辑页当前 Seedance 提示词为只读文本框，参考图由后端根据分镜实体关联隐式注入，用户无法在片段级别手动选择参考图。资产页已支持「采纳参考图」，但编辑页缺少 `@` 引用能力，且「部分参考图缺失」提示对用户无实际帮助。需要将提示词改为可编辑的 Tiptap 编辑器，支持 `@` 选择本项目已采纳的实体参考图，并在生成时显式传递文字与图片资源。

## What Changes

- 视频编辑页 `SegmentCard` 将只读 textarea 替换为 **Tiptap 编辑器**，支持 `@` 触发下拉选择参考图
- `@` 下拉数据源：**当前项目**内所有**已采纳**（`entity.assetId` 有值）的实体参考图，展示缩略图与实体名
- 选中后在编辑器内插入 mention chip（含 `assetId`、实体名、预览 URL）
- **移除**「部分参考图缺失」warning 及 `segmentMissingRefs` 逻辑
- **BREAKING**：`generateSegmentVideo` 不再根据 `characterRefIds/sceneRefId/propRefIds` 自动收集参考图；仅使用用户在编辑器中 `@` 选中的 `assetIds`
- 编辑器**失焦时**持久化片段提示词与引用资产到 segment JSON
- 解析分镜后**不预填** `@` mention；初始内容为 DeepSeek 产出的 `seedancePrompt` 纯文本
- 新增后端 API：列出项目已采纳实体参考图、更新片段 prompt、扩展 generate-video 请求体

## Capabilities

### New Capabilities

（无新增独立 capability）

### Modified Capabilities

- `short-video-project`: 视频编辑片段提示词改为 Tiptap + `@` 引用已采纳实体图；废弃隐式自动带图；移除缺失参考图 warning；新增片段 prompt 持久化 API

## Impact

- **前端** `apps/web/`：新增 Tiptap 依赖（`@tiptap/react`、`@tiptap/starter-kit`、`@tiptap/extension-mention` 等）；新增 `SegmentPromptEditor` 组件；重构 `SegmentCard`、`edit/page.tsx`
- **后端** `apps/api/src/short-video/`：新增 `listAdoptedEntityImages`、`updateSegmentPrompt`；修改 `generateSegmentVideo` 接受 `prompt` + `assetIds`
- **类型** `Segment` JSON 新增 `referenceAssetIds`、`seedancePromptDoc`（Tiptap 文档）
- **OpenSpec** `openspec/specs/short-video-project/spec.md`：MODIFIED 视频生成 requirement；REMOVED 缺失参考图 warning scenario；ADDED Tiptap/@ mention/persist requirements
