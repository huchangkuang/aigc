## 1. OSS 删除 (oss-storage)

- [x] 1.1 `StorageService.deleteObject(ossKey)` — mock no-op；真实 OSS `client.delete`；NoSuchKey 视为成功 — 测试：`apps/api/src/storage/__test__/storage.service.spec.ts` — 验证：`pnpm --filter @aigc/api test storage.service`

## 2. 资产回收站 API (asset-library)

- [x] 2.1 `listTrashForUser` + `GET /assets/trash`（`deletedAt` 降序，可选 type，含 previewUrl）— 测试：`apps/api/src/asset/__test__/asset.service.spec.ts`、`asset.controller.spec.ts` — 验证：`pnpm --filter @aigc/api test asset`
- [x] 2.2 `restoreForUser` + `POST /assets/:id/restore` — 测试：`apps/api/src/asset/__test__/asset.service.spec.ts` — 验证：`pnpm --filter @aigc/api test asset.service`
- [x] 2.3 `destroyForUser` + `DELETE /assets/:id/permanent`（OSS delete → DB delete）— 测试：`apps/api/src/asset/__test__/asset.service.spec.ts`、`asset.controller.spec.ts` — 验证：`pnpm --filter @aigc/api test asset`
- [x] 2.4 路由顺序：`GET /assets/trash` 注册于 `GET /assets/:id` 之前 — 验证：`pnpm --filter @aigc/api test asset.controller`

## 3. 前端 API 与侧边栏

- [x] 3.1 `api-client` 增加 `listTrashAssets`、`restoreAsset`、`destroyAsset` — 测试：`apps/web/src/lib/__test__/api-client.test.ts` — 验证：`pnpm --filter @aigc/web test api-client`
- [x] 3.2 `app-shell.tsx` 侧边栏第四项「回收站」→ `/trash` — 测试：`apps/web/src/components/__test__/app-shell.test.tsx` — 验证：`pnpm --filter @aigc/web test app-shell`

## 4. 回收站 UI

- [x] 4.1 实现 `/trash` 页面（类型筛选、搜索、网格、空状态）— 测试：`apps/web/src/app/(workspace)/trash/__test__/page.test.tsx` — 验证：`pnpm --filter @aigc/web test trash`
- [x] 4.2 `AssetCard` 增加 `variant="trash"` + `TrashAssetCardMenu`（恢复、销毁二次确认；保留预览/下载）— 测试：`apps/web/src/components/__test__/trash-asset-card-menu.test.tsx` — 验证：`pnpm --filter @aigc/web test trash-asset-card-menu`
- [x] 4.3 修正资产库 `AssetCardMenu` 软删确认文案（移入回收站）— 测试：`apps/web/src/components/__test__/asset-card-menu.test.tsx` — 验证：`pnpm --filter @aigc/web test asset-card-menu`

## 5. 集成验收

- [x] 5.1 全量单测 — 验证：`pnpm test`
- [x] 5.2 手动冒烟：资产库软删 → 回收站可见 → 恢复回资产库 → 再次软删 → 永久销毁
