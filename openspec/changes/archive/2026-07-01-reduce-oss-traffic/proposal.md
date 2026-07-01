## Why

创作中心在任务进行中每 5 秒轮询 `GET /generation-tasks`，后端每次为全部历史 asset 重新生成 OSS 签名 URL；前端 `<img>` / `<video>` 的 `src` 随之变化，浏览器将已加载的媒体当作新资源重复从 OSS 下载。单个 10MB 视频在页面挂 10 分钟即可消耗约 2GB 下行流量，与用户观测到的流量包快速耗尽一致。需在不大改架构的前提下止血，降低 OSS 按量费用风险。

## What Changes

- **后端**：`StorageService.getSignedUrl` 增加内存缓存，同一 `ossKey` 在 TTL 内返回稳定 URL
- **后端**：新增轻量轮询接口 `GET /generation-tasks/active`，仅返回进行中任务的状态字段（不含 asset 签名 URL）
- **前端**：创作中心轮询改用 active 接口；任务完成或首次加载时再拉完整列表
- **前端**：合并任务 state 时按 `asset.id` 保留已有 `previewUrl`，避免无意义的 `src` 更新
- **前端**：标签页不可见时暂停轮询（Page Visibility API）
- **前端**：列表/网格中的视频预览改用 poster 图或占位，避免 `<video src>` 拉取完整 MP4
- **类型**：`TaskAsset` / `Asset` 补充 `ossKey` 字段声明

**不在本变更范围：**

- CDN、Nginx 媒体代理、Prisma 新增 `thumbOssKey` 字段
- 任务/资产列表分页
- `inputParams.image_urls` 从 signed URL 改为 ossKey 存储（后续独立变更）

## Capabilities

### New Capabilities

- `media-loading`: 前端媒体预览与轮询策略——稳定 URL 复用、轻量轮询、Tab 隐藏暂停、视频列表不预载完整视频

### Modified Capabilities

- `oss-storage`: 签名 URL 须在有效期内保持稳定，避免每次 API 调用生成不同 URL
- `jimeng-generation`: 新增 active 任务查询接口，轮询场景不得携带全量历史 asset 签名

## Impact

- **apps/api**: `storage.service.ts`（签名缓存）、`generation.controller.ts`（active 端点）、相关单元测试
- **apps/web**: `generate/page.tsx`（轮询与 state merge）、`media-preview.tsx`（视频 poster 模式）、`api-client.ts`（新接口与类型）
- **openspec/specs**: `oss-storage`、`jimeng-generation` delta；新增 `media-loading` spec
- **运维**: 无新环境变量；部署后 OSS 下行流量应显著下降，无需改 Nginx/OSS 配置
