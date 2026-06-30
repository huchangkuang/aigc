## 1. 数据模型（软删）

- [x] 1.1 Prisma `Asset` 增加 `deletedAt DateTime?`；migration — 验证：`pnpm --filter @aigc/api prisma:migrate`
- [x] 1.2 `listForUser` / `getForUser` 默认过滤 `deletedAt IS NULL` — 测试：`apps/api/src/asset/__test__/asset.service.spec.ts` — 验证：`pnpm --filter @aigc/api test asset.service`

## 2. 资产 API 扩展 (asset-library)

- [x] 2.1 `PATCH /assets/:id` 重命名 `{ title }` → `metadata.title` — 测试：`apps/api/src/asset/__test__/asset.controller.spec.ts` — 验证：`pnpm --filter @aigc/api test asset.controller`
- [x] 2.2 `DELETE /assets/:id` 软删 — 测试：`apps/api/src/asset/__test__/asset.service.spec.ts` — 验证：`pnpm --filter @aigc/api test asset.service`
- [x] 2.3 `GET /assets/:id/compose-context` 返回 prompt、signed imageUrls、generationType 及全部 inputParams — 测试：`apps/api/src/asset/__test__/asset.controller.spec.ts` — 验证：`pnpm --filter @aigc/api test asset.controller`

## 3. 前端 API 与 Store

- [x] 3.1 `api-client` 增加 `renameAsset`、`deleteAsset`、`getComposeContext` — 测试：`apps/web/src/lib/__test__/api-client.test.ts` — 验证：`pnpm --filter @aigc/web test api-client`
- [x] 3.2 实现 `composer-draft-store`（setDraft / consumeDraft / clearDraft）— 测试：`apps/web/src/stores/__test__/composer-draft-store.test.ts` — 验证：`pnpm --filter @aigc/web test composer-draft`

## 4. UI 组件

- [x] 4.1 实现 `ConfirmDialog` — 测试：`apps/web/src/components/__test__/confirm-dialog.test.tsx` — 验证：`pnpm --filter @aigc/web test confirm-dialog`
- [x] 4.2 实现 `AssetCardMenu`（dropdown + 5 项 + stopPropagation）— 测试：`apps/web/src/components/__test__/asset-card-menu.test.tsx` — 验证：`pnpm --filter @aigc/web test asset-card-menu`
- [x] 4.3 集成到 `AssetCard`：标题优先级 title → prompt → 未命名；删除后回调刷新列表 — 测试：`apps/web/src/components/__test__/asset-card.test.tsx` — 验证：`pnpm --filter @aigc/web test asset-card`
- [x] 4.4 资产页传入 `onAssetChange` 刷新 — 测试：`apps/web/src/app/(workspace)/assets/__test__/page.test.tsx` — 验证：`pnpm --filter @aigc/web test assets`

## 5. 创作页预填 (generation-composer-prefill)

- [x] 5.1 `generate/page.tsx` mount 时 `consumeDraft()` 并应用到 type/prompt/imageUrls/frames 等 — 测试：`apps/web/src/app/(workspace)/generate/__test__/page.test.tsx` — 验证：`pnpm --filter @aigc/web test generate`
- [x] 5.2 菜单 action 调用 compose-context → 写 draft → `router.push('/generate')` — 测试：`apps/web/src/components/__test__/asset-card-menu.test.tsx` — 验证：`pnpm --filter @aigc/web test asset-card-menu`

## 6. 集成验收

- [x] 6.1 全量单测 — 验证：`pnpm test`
- [x] 6.2 手动冒烟：资产页重命名 → 同款生成跳转预填 → 仅用图片/提示词 → 软删确认
