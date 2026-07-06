## 1. 后端：停止自动 adopt + 历史查询

- [x] 1.1 在 `apps/api/src/short-video/__test__/short-video-task-linker.spec.ts` 写测试：image 任务完成时创建 Asset 但不更新 `entity.assetId`；运行 `pnpm --filter @aigc/api test -- short-video-task-linker` 确认 RED
- [x] 1.2 修改 `ShortVideoTaskLinkerService.onTaskCompleted` image 分支：移除自动写 `assetId`；确认上述测试 GREEN
- [x] 1.3 在 `apps/api/src/short-video/__test__/entity-images.spec.ts` 写测试：`listEntityImages` 按 projectId+entityId metadata 过滤并返回 `adopted` 标志；运行 `pnpm --filter @aigc/api test -- entity-images` 确认 RED
- [x] 1.4 在 `ShortVideoProjectService` 实现 `listEntityImages`；确认测试 GREEN

## 2. 后端：采纳与上传 API

- [x] 2.1 在 `apps/api/src/short-video/__test__/entity-images.spec.ts` 写测试：`adoptEntityImage` 校验 asset 归属与 metadata，成功写入 `entity.assetId`；非法 asset 返回 400/404；运行 `pnpm --filter @aigc/api test -- entity-images` 确认 RED
- [x] 2.2 实现 `adoptEntityImage` + `POST .../adopt-image` 控制器路由；确认测试 GREEN
- [x] 2.3 在同 spec 写测试：`uploadEntityImage` 从 ossKey 创建 Asset（source short_video + metadata），不修改 `assetId`；运行确认 RED
- [x] 2.4 实现 `uploadEntityImage` + DTO + `POST .../upload-image` 路由；确认测试 GREEN
- [x] 2.5 注册 `GET .../entities/:entityId/images` 控制器路由；全量 `pnpm --filter @aigc/api test` 通过

## 3. 前端：API 客户端

- [x] 3.1 在 `apps/web/src/lib/__test__/api-client.test.ts` 写测试：`listEntityImages`、`adoptEntityImage`、`uploadEntityImage` 请求路径与 body；运行 `pnpm --filter @aigc/web test -- api-client` 确认 RED
- [x] 3.2 在 `apps/web/src/lib/api-client.ts` 实现三个方法；确认测试 GREEN

## 4. 前端：EntityCard UI 重构

- [x] 4.1 在 `apps/web/src/components/__test__/entity-image-history.test.tsx` 写测试：历史缩略图渲染、点击切换预览、采纳按钮回调、本地上传触发；运行 `pnpm --filter @aigc/web test -- entity-image-history` 确认 RED
- [x] 4.2 新增 `EntityImagePreview` 与 `EntityImageHistory` 子组件，重构 `EntityCard` 为上下布局（预览 + 历史 + prompt）；确认测试 GREEN
- [x] 4.3 在 `apps/web/src/app/(workspace)/short-video/[projectId]/assets/__test__/page.test.tsx` 更新测试：加载 per-entity 历史、生图后不自动显示已采用、采纳后显示已采用；运行 `pnpm --filter @aigc/web test -- assets/page` 确认 RED 再 GREEN
- [x] 4.4 更新 `assets/page.tsx`：按实体拉历史、处理 adopt/upload/generate 回调与任务完成后 refresh；全量 `pnpm test` 通过
