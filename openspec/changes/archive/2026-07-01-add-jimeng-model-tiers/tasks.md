## 1. 后端能力配置

- [x] 1.1 新增 `apps/api/src/generation/generation-capabilities.ts`（`MODEL_OPTIONS`、`resolveReqKey`、`listModelsForType`）；测试：`apps/api/src/generation/__test__/generation-capabilities.spec.ts`；验证：`pnpm --filter @aigc/api test -- generation-capabilities`
- [x] 1.2 移除 `REQ_KEY_MAP`，`generation-task.service.ts` 改用 `resolveReqKey`；更新 `jimeng.service.spec.ts` / `generation-task.service.spec.ts`；验证：`pnpm --filter @aigc/api test -- generation-task jimeng`

## 2. 后端 API

- [x] 2.1 `CreateGenerationTaskDto` 增加可选 `model` 字段；`buildInputParams` 持久化 `model`；非法组合 400；测试：`generation-task.service.spec.ts`；验证：`pnpm --filter @aigc/api test -- generation-task.service`
- [x] 2.2 新增 `GET /generation/models?type=` 端点（controller + 鉴权）；测试：controller 或 e2e spec；验证：`pnpm --filter @aigc/api test -- generation`
- [x] 2.3 e2e：默认 model 与 1080/pro 各一条创建任务断言 reqKey；测试：`apps/api/test/__test__/generation.e2e-spec.ts`；验证：`pnpm --filter @aigc/api test -- generation.e2e`



## 3. 前端 API 与 Composer

- [x] 3.1 `api-client.ts` 增加 `listModels(type)` 与 createTask body 的 `model`；测试：`apps/web/src/lib/__test__/api-client.test.ts`（若无则新建）；验证：`pnpm --filter @aigc/web test -- api-client`
- [x] 3.2 `GenerationComposer` 增加模型 PillSelect；type 变化时拉取 models 并校正默认项；测试：`apps/web/src/components/__test__/generation-composer.test.tsx`；验证：`pnpm --filter @aigc/web test -- generation-composer`
- [x] 3.3 `generate/page.tsx` 增加 `model` state，提交时携带；验证：`pnpm --filter @aigc/web test`



## 4. 做同款预填

- [x] 4.1 `composer-draft-store` / `composer-draft.ts` / asset 动作写入 draft 时包含 `model`（从 task inputParams 读取）；测试：`apps/web/src/lib/__test__/composer-draft.test.ts`；验证：`pnpm --filter @aigc/web test -- composer-draft`
- [x] 4.2 generate page draft 消费时 `setModel`；更新 prefill spec 场景；验证：`pnpm --filter @aigc/web test`



## 5. 收尾

- [x] 5.1 全量测试通过：`pnpm test`
- [x] 5.2 手动冒烟：创作中心切换 type/model 组合提交，确认 reqKey 与即梦任务创建成功