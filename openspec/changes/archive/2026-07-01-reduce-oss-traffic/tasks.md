## 1. 后端：签名 URL 缓存

- [x] 1.1 在 `apps/api/src/storage/__test__/storage.service.spec.ts` 编写缓存测试：同一 `ossKey` 在 TTL 内返回相同 URL、过期后返回新 URL。验证：`pnpm --filter @aigc/api test -- storage.service.spec.ts`
- [x] 1.2 在 `StorageService.getSignedUrl` 实现进程内 `Map` 缓存（TTL = expiresSeconds × 0.9）。验证：上述测试通过

## 2. 后端：轻量 active 轮询接口

- [x] 2.1 在 `apps/api/src/generation/__test__/generation.controller.spec.ts` 编写 `GET /generation-tasks/active` 测试：仅返回 pending/processing、无 previewUrl。验证：`pnpm --filter @aigc/api test -- generation.controller.spec.ts`
- [x] 2.2 在 `GenerationTaskService` 新增 `listActiveForUser(userId)` 查询方法。验证：单元测试或 controller 测试覆盖
- [x] 2.3 在 `GenerationController` 新增 `@Get('active')` 端点（注意路由顺序，放在 `:id` 之前）。验证：上述测试通过

## 3. 前端：工具函数与 API 客户端

- [x] 3.1 在 `apps/web/src/lib/__test__/merge-tasks-stable-urls.test.ts` 编写 `mergeTasksWithStableUrls` 测试：相同 asset 保留旧 previewUrl、新 asset 采用新 URL。验证：`pnpm --filter @aigc/web test -- merge-tasks-stable-urls.test.ts`
- [x] 3.2 实现 `apps/web/src/lib/merge-tasks-stable-urls.ts` 纯函数。验证：上述测试通过
- [x] 3.3 在 `api-client.ts` 新增 `listActiveTasks()` 及 `TaskAsset`/`Asset` 的 `ossKey` 类型字段。验证：`pnpm --filter @aigc/web test`

## 4. 前端：创作中心轮询改造

- [x] 4.1 在 `apps/web/src/app/(workspace)/generate/__test__/page.test.tsx` 补充测试：有 active 任务时调用 active 接口、完成后调用 full list。验证：`pnpm --filter @aigc/web test -- page.test.tsx`
- [x] 4.2 改造 `generate/page.tsx`：初次/提交后 full list；轮询 active；active 清空后 full list；merge 稳定 URL；Page Visibility 暂停轮询。验证：上述测试通过

## 5. 前端：视频缩略图模式

- [x] 5.1 在 `apps/web/src/components/__test__/media-preview.test.tsx` 编写测试：`variant="thumbnail"` 时视频不渲染 `src`。验证：`pnpm --filter @aigc/web test -- media-preview.test.tsx`
- [x] 5.2 `MediaPreview` 增加 `variant` prop；thumbnail 模式用静态占位，lightbox 点击后才加载视频。验证：上述测试通过
- [x] 5.3 `GenerationHistoryGrid` 与 `AssetCard` 的视频传入 `variant="thumbnail"`。验证：`pnpm --filter @aigc/web test`

## 6. 集成验证

- [x] 6.1 全量测试：`pnpm test`
- [ ] 6.2 本地手动验证：开着创作中心等待任务完成，DevTools Network 确认轮询期间无重复 OSS 媒体请求
