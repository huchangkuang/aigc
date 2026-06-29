## 1. 数据模型与环境配置

- [x] 1.1 扩展 Prisma schema：User.passwordHash、GenerationTask、Asset 枚举与关系；编写 migration — 验证：`pnpm --filter @aigc/api prisma:migrate`
- [x] 1.2 更新 `apps/api/.env.example` 与 `apps/web/.env.example`（JWT、PRESET_USERS、VOLCENGINE_AK/SK、OSS 配置）— 验证：文档可读
- [x] 1.3 编写 seed 脚本解析 PRESET_USERS 创建预设用户 — 测试：`apps/api/src/auth/auth.seed.spec.ts` — 验证：`pnpm --filter @aigc/api test auth.seed`

## 2. 用户认证 (user-auth)

- [x] 2.1 实现 AuthModule：bcrypt 校验、JWT 签发、AuthGuard — 测试：`apps/api/src/auth/auth.service.spec.ts` — 验证：`pnpm --filter @aigc/api test auth.service`
- [x] 2.2 实现 `POST /auth/login` 与全局 Guard 保护业务路由 — 测试：`apps/api/src/auth/auth.controller.spec.ts` — 验证：`pnpm --filter @aigc/api test auth.controller`
- [x] 2.3 前端 auth store + login 页 + API client 携带 Bearer — 测试：`apps/web/src/stores/auth-store.test.ts`、`apps/web/src/app/login/page.test.tsx` — 验证：`pnpm --filter @aigc/web test auth`
- [x] 2.4 前端 authenticated layout / 路由守卫（未登录跳转 /login）— 测试：`apps/web/src/middleware.test.ts` 或 layout 测试 — 验证：`pnpm --filter @aigc/web test`

## 3. OSS 存储 (oss-storage)

- [x] 3.1 实现 StorageModule（ali-oss）：upload、download stream、signedUrl — 测试：`apps/api/src/storage/storage.service.spec.ts` — 验证：`pnpm --filter @aigc/api test storage.service`
- [x] 3.2 实现 `POST /storage/upload` 参考图上传（类型/大小校验）— 测试：`apps/api/src/storage/storage.controller.spec.ts` — 验证：`pnpm --filter @aigc/api test storage.controller`
- [x] 3.3 实现 persistFromUrl(taskId, urls) 供任务完成回调 — 测试：`apps/api/src/storage/storage.service.spec.ts`（persist 场景）— 验证：`pnpm --filter @aigc/api test storage`

## 4. 即梦生成 (jimeng-generation)

- [x] 4.1 实现 JimengService：火山签名、submitTask、getResult；req_key 映射 — 测试：`apps/api/src/jimeng/jimeng.service.spec.ts` — 验证：`pnpm --filter @aigc/api test jimeng.service`
- [x] 4.2 实现 GenerationTaskService：创建任务、状态机 — 测试：`apps/api/src/generation/generation-task.service.spec.ts` — 验证：`pnpm --filter @aigc/api test generation-task`
- [x] 4.3 实现 `POST /generation-tasks` 支持五种 type 及参数校验 — 测试：`apps/api/src/generation/generation.controller.spec.ts` — 验证：`pnpm --filter @aigc/api test generation.controller`
- [x] 4.4 实现轮询 Scheduler：poll 进行中任务、完成时调用 OSS persist — 测试：`apps/api/src/generation/generation-poller.service.spec.ts` — 验证：`pnpm --filter @aigc/api test generation-poller`
- [x] 4.5 实现 `GET /generation-tasks` 与 `GET /generation-tasks/:id` — 测试：`apps/api/src/generation/generation.controller.spec.ts` — 验证：`pnpm --filter @aigc/api test generation.controller`

## 5. 资产库 (asset-library)

- [x] 5.1 实现 AssetModule：任务完成后创建 Asset、列表/详情/筛选 — 测试：`apps/api/src/asset/asset.service.spec.ts` — 验证：`pnpm --filter @aigc/api test asset.service`
- [x] 5.2 实现 `GET /assets`、`GET /assets/:id`、下载/预览 URL — 测试：`apps/api/src/asset/asset.controller.spec.ts` — 验证：`pnpm --filter @aigc/api test asset.controller`
- [x] 5.3 前端资产页 `/assets`：网格、类型筛选、空状态 — 测试：`apps/web/src/app/assets/page.test.tsx` — 验证：`pnpm --filter @aigc/web test assets`

## 6. 前端生成工作台

- [x] 6.1 实现 `/generate` 页：类型切换、五种表单、提交任务 — 测试：`apps/web/src/app/generate/page.test.tsx` — 验证：`pnpm --filter @aigc/web test generate`
- [x] 6.2 实现任务状态展示（轮询或 SWR 刷新 recent tasks）— 测试：`apps/web/src/components/generation-task-list.test.tsx` — 验证：`pnpm --filter @aigc/web test generation-task`
- [x] 6.3 应用 shell 布局：导航（生成 / 资产 / 登出）— 测试：`apps/web/src/components/app-shell.test.tsx` — 验证：`pnpm --filter @aigc/web test app-shell`

## 7. 集成与验收

- [x] 7.1 全量单测通过 — 验证：`pnpm test`
- [x] 7.2 本地 E2E 冒烟：docker mysql up → seed → 登录 → 提交文生图（或 mock）→ 资产可见 — 验证：手动或 `apps/api/test/generation.e2e-spec.ts` 运行 `pnpm --filter @aigc/api test:e2e`
- [x] 7.3 更新 README：MVP 环境变量说明与即梦/OSS 配置指引 — 验证：文档 review
