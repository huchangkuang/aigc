## 1. 数据模型与迁移

- [x] 1.1 Prisma 新增 `AssetSource` enum、`ShortVideoProject` model、`Asset.source` 字段及 migration；验证：`pnpm --filter @aigc/api prisma:migrate:deploy`
- [x] 1.2 `.env.example` 增加 `DEEPSEEK_API_KEY`；验证：本地配置可读

## 2. DeepSeek 服务

- [x] 2.1 新增 `DeepSeekService`（OpenAI 兼容，`deepseek-chat`，JSON 输出）；测试：`apps/api/src/deepseek/__test__/deepseek.service.spec.ts`；验证：`pnpm --filter @aigc/api test -- deepseek`
- [x] 2.2 新增实体/分镜解析 prompt 与 JSON schema 校验（Zod 或 class-validator）；测试：`apps/api/src/short-video/__test__/script-parser.spec.ts`；验证：`pnpm --filter @aigc/api test -- script-parser`
- [x] 2.3 实现 re-parse 合并逻辑（保留 assetId / videoAssetId）；测试：`apps/api/src/short-video/__test__/entity-merge.spec.ts`；验证：`pnpm --filter @aigc/api test -- entity-merge`

## 3. 短视频项目 API

- [x] 3.1 新增 `ShortVideoModule`：项目 CRUD（list/create/get/patch/delete）；测试：`apps/api/src/short-video/__test__/short-video-project.service.spec.ts`；验证：`pnpm --filter @aigc/api test -- short-video-project`
- [x] 3.2 `POST .../parse-entities` 与 `POST .../parse-segments`；测试：controller spec；验证：`pnpm --filter @aigc/api test -- short-video`
- [x] 3.3 `POST .../entities/:id/generate-image` 复用 GenerationTask，写 Asset source=short_video；测试：integration spec；验证：`pnpm --filter @aigc/api test -- short-video`
- [x] 3.4 `POST .../segments/:id/generate-video` 复用 video_seedance_r2v；测试：integration spec；验证：`pnpm --filter @aigc/api test -- short-video`

## 4. 资产库来源筛选

- [x] 4.1 `GET /assets` 与 `GET /assets/trash` 支持 `source` query；测试：`apps/api/src/asset/__test__/asset.service.spec.ts`；验证：`pnpm --filter @aigc/api test -- asset.service`
- [x] 4.2 素材生成落库时显式 `source=material`（默认）；短视频落库 `source=short_video`；验证：`pnpm --filter @aigc/api test -- asset`

## 5. 前端路由与导航

- [x] 5.1 `AppShell` 增加「短视频」导航；测试：`apps/web/src/components/__test__/app-shell.test.tsx`；验证：`pnpm --filter @aigc/web test -- app-shell`
- [x] 5.2 项目列表页 `/short-video`（创建、列表、删除）；测试：`apps/web/src/app/(workspace)/short-video/__test__/page.test.tsx`；验证：`pnpm --filter @aigc/web test -- short-video`
- [x] 5.3 项目 layout + 内侧边栏（剧本/资产/视频编辑）；测试：`apps/web/src/components/__test__/project-shell.test.tsx`；验证：`pnpm --filter @aigc/web test -- project-shell`

## 6. 前端三 Tab 页面

- [x] 6.1 剧本 Tab：编辑 rawScript、触发 parse-entities；测试：`apps/web/src/app/(workspace)/short-video/[projectId]/script/__test__/page.test.tsx`；验证：`pnpm --filter @aigc/web test -- script`
- [x] 6.2 资产 Tab：实体卡片、手动生图、展示绑定缩略图；测试：`apps/web/src/app/(workspace)/short-video/[projectId]/assets/__test__/page.test.tsx`；验证：`pnpm --filter @aigc/web test -- assets`
- [x] 6.3 视频编辑 Tab：parse-segments、片段卡片、逐段 Seedance 生成与预览；测试：`apps/web/src/app/(workspace)/short-video/[projectId]/edit/__test__/page.test.tsx`；验证：`pnpm --filter @aigc/web test -- edit`
- [x] 6.4 `api-client.ts` 扩展短视频与 assets source 参数；测试：`apps/web/src/lib/__test__/api-client.test.ts`；验证：`pnpm --filter @aigc/web test -- api-client`

## 7. 资产页双维筛选

- [x] 7.1 资产页增加来源（全部/素材/短视频）与格式（全部/图片/视频）筛选 UI；测试：`apps/web/src/app/(workspace)/assets/__test__/page.test.tsx`；验证：`pnpm --filter @aigc/web test -- assets`

## 8. 收尾

- [x] 8.1 全量测试：`pnpm test`
- [x] 8.2 手动冒烟：创建项目 → 解析实体 → 生一张参考图 → 解析分镜 → 生成一段 Seedance 视频 → 资产库双筛选可见
