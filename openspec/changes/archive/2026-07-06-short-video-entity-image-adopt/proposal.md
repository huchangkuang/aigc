## Why

短视频资产页当前每个实体只保留「最后一次生成」的参考图，重新生图会直接覆盖绑定，用户无法对比候选图或从本地上传自定义参考图。视频编辑应使用用户明确采纳的参考图，而非隐式采用最新生成结果。

## What Changes

- 实体参考图改为**候选池 + 手动采纳**：`entity.assetId` 仅表示用户采纳、用于视频编辑的参考图
- AI 生图完成后新图进入该实体的历史列表，大图预览切换到新图，**不自动**写入 `assetId`
- 支持本地上传参考图，上传后进入历史列表，**不自动**采纳
- 资产页 UI：大图下方展示该实体的生成/上传历史缩略图；缩略图可点击预览；提供「采纳」按钮
- 大图展示「已采用」状态（当预览图与 `assetId` 一致时）
- **BREAKING**：生图任务完成时不再自动更新 `entity.assetId`（现有「重新生成即替换参考图」行为变更）
- 本期不包含：历史图删除、多视角图 Tab

## Capabilities

### New Capabilities

（无新增独立 capability；行为扩展在现有 short-video-project 内）

### Modified Capabilities

- `short-video-project`: 实体参考图从单张覆盖改为历史列表 + 手动采纳 + 本地上传；视频编辑仅使用已采纳的 `assetId`

## Impact

- **后端** `apps/api/src/short-video/`：新增 list/adopt/upload 端点；调整 `ShortVideoTaskLinkerService.onTaskCompleted` 生图完成逻辑
- **前端** `apps/web/src/components/entity-card.tsx` 及 `assets/page.tsx`：UI 重构为预览 + 历史 + 采纳
- **API 客户端** `apps/web/src/lib/api-client.ts`：新增对应方法
- **OpenSpec** `openspec/specs/short-video-project/spec.md`：更新资产生图相关 requirement
