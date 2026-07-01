## Context

创作中心页面在存在 `pending` / `processing` 任务时每 5 秒调用 `GET /generation-tasks`。该接口为**全部**历史任务的**全部** asset 调用 `StorageService.getSignedUrl()`。OSS 签名 URL 的 `Expires` 参数基于当前时间计算，每次调用产生不同字符串。前端 `setTasks(data)` 全量替换后，`<img>` / `<video>` 的 `src` 变化，浏览器重新从 OSS 下载媒体——视频文件可达数 MB 至数十 MB，导致下行流量在分钟级耗尽免费/小额流量包。

当前相关模块：
- 后端：`generation.controller.ts`、`storage.service.ts`、`asset.controller.ts`
- 前端：`generate/page.tsx`、`media-preview.tsx`、`generation-history-grid.tsx`、`generation-preview-panel.tsx`

## Goals / Non-Goals

**Goals:**

- 轮询期间不因 URL 变化触发媒体重复下载
- 轮询请求不携带全量历史 asset 签名
- 列表/网格中的视频预览不拉取完整 MP4
- 标签页后台时停止无意义轮询
- 改动范围可控，个人项目可快速部署

**Non-Goals:**

- CDN、Nginx 反向代理 OSS、媒体流式代理
- Prisma schema 新增 `thumbOssKey` 或服务端截帧
- 任务/资产分页
- `inputParams.image_urls` 存储格式迁移（signed URL → ossKey）
- Redis 等分布式签名缓存（单实例 pm2 内存缓存足够）

## Decisions

### 1. 签名 URL 进程内缓存（后端）

在 `StorageService` 维护 `Map<ossKey, { url, expiresAt }>`。缓存 TTL 设为签名有效期的 90%（默认 `expiresSeconds=3600` 时缓存约 54 分钟），到期前同一 `ossKey` 返回相同 URL。

**备选**：仅前端缓存 → 无法解决资产页 reload、多标签页等问题。  
**备选**：Redis → 过度设计。

### 2. 轻量 active 轮询接口（后端）

新增 `GET /generation-tasks/active`，返回 `{ id, status, errorMessage, updatedAt }[]`，仅 `pending` / `processing` 任务，不含 assets、不调用 `getSignedUrl`。

前端逻辑：
- 有 active 任务 → 轮询 active 接口
- active 从非空变空（全部完成）→ 调用一次完整 `GET /generation-tasks` 刷新预览
- 页面初次加载、用户提交新任务后 → 完整 list

**备选**：`?includeAssets=false` 查询参数 → 语义不如专用端点清晰，且仍返回全量任务列表。

### 3. 前端 state merge（双保险）

`refreshTasks` 合并新数据时，对已存在 `asset.id` 且 `ossKey` 未变的条目，保留本地 `previewUrl`，不采用 API 返回的新 URL。提取为纯函数 `mergeTasksWithStableUrls(prev, next)` 便于单测。

遵循项目规范：不为此引入 `useMemo`/`useCallback`，merge 函数放 `lib/` 模块。

### 4. 视频列表预览策略

`MediaPreview` 增加 `variant?: 'thumbnail' | 'full'`（默认 `full`）。

- `thumbnail`：视频渲染为带播放图标的静态占位 + `preload="none"`，**不设置** `<video src>`；用户点击后在 `MediaLightbox` 中加载完整 `src`
- 用于 `GenerationHistoryGrid`、资产卡片网格
- `GenerationPreviewPanel` 主预览区保持 `full`（用户明确要看结果）

**备选**：服务端生成缩略图 → 需 schema 变更与 ffmpeg，超出本变更范围。

### 5. Page Visibility 暂停轮询

`document.visibilityState === 'hidden'` 时清除 interval；变为 `visible` 时立即 refresh 一次并恢复 interval。与 active 轮询共用同一 effect。

### 6. 类型补全

`TaskAsset` / `Asset` 增加 `ossKey?: string`，与 API 实际响应对齐，供 merge 逻辑使用。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 进程重启后缓存失效，首次 list 仍生成新 URL | 前端 merge 双保险；重启后仅一次下载 |
| 签名临近过期时媒体加载失败 | 缓存 TTL 90%；失败时前端可用 asset id 触发重新 list |
| active 完成瞬间用户看不到新预览 | 检测到 active 清空后立即 full list |
| thumbnail 模式视频无真实首帧 | 可接受；点击 lightbox 后加载完整视频 |
| 多 pm2 实例各自缓存 | 当前 `instances: 1`，无问题 |

## Migration Plan

1. 先后端部署（签名缓存 + active 端点）——向后兼容，旧前端仍可用
2. 再前端部署（轮询改造 + MediaPreview variant）
3. 无需数据库迁移
4. 回滚：还原代码即可，无数据副作用

## Open Questions

- 无阻塞项。缩略图首帧可列为后续独立变更。
