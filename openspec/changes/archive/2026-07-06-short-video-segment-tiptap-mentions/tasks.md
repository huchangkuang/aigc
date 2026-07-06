## 1. 后端：类型与 adopted 实体图列表

- [x] 1.1 在 `apps/api/src/short-video/__test__/adopted-entity-images.spec.ts` 写测试：`listAdoptedEntityImages` 仅返回 `parsedEntities` 中 `assetId` 有值的实体及 previewUrl；无采纳时返回空数组；运行 `pnpm --filter @aigc/api test -- adopted-entity-images` 确认 RED
- [x] 1.2 扩展 `Segment` 类型（api + web）新增 `referenceAssetIds`、`seedancePromptDoc`；实现 `listAdoptedEntityImages` + `GET .../adopted-entity-images` 路由；确认测试 GREEN

## 2. 后端：片段 prompt 持久化

- [x] 2.1 在 `apps/api/src/short-video/__test__/segment-prompt.spec.ts` 写测试：`updateSegmentPrompt` 写入 seedancePrompt/referenceAssetIds/seedancePromptDoc；非法 assetId 返回 400；运行 `pnpm --filter @aigc/api test -- segment-prompt` 确认 RED
- [x] 2.2 实现 `updateSegmentPrompt` + `UpdateSegmentPromptDto` + `PATCH .../segments/:segmentId` 路由；确认测试 GREEN
- [x] 2.3 在 `apps/api/src/short-video/__test__/entity-merge.spec.ts` 补充测试：re-parse segments 时保留已有 segment 的 seedancePromptDoc、referenceAssetIds、用户编辑的 seedancePrompt；运行确认 RED
- [x] 2.4 修改 segment merge 逻辑保留用户编辑字段；确认测试 GREEN

## 3. 后端：generateSegmentVideo 改造

- [x] 3.1 在 `apps/api/src/short-video/__test__/segment-generate.spec.ts` 写测试：generate 使用请求体 prompt + assetIds，不再从 characterRefIds 自动带图；非法 assetId 400；无 assetIds 时纯文本生成；运行 `pnpm --filter @aigc/api test -- segment-generate` 确认 RED
- [x] 3.2 扩展 `GenerateSegmentVideoDto`（prompt 必填、assetIds 可选）；重写 `generateSegmentVideo` 校验与 image_urls 解析（上限 14）；确认测试 GREEN；全量 `pnpm --filter @aigc/api test` 通过

## 4. 前端：Tiptap 依赖与提取 util

- [x] 4.1 在 `apps/web/package.json` 添加 Tiptap 依赖（`@tiptap/react`、`@tiptap/starter-kit`、`@tiptap/extension-mention`、`@tiptap/suggestion`）；`pnpm install`
- [x] 4.2 在 `apps/web/src/lib/__test__/segment-prompt-doc.test.ts` 写测试：从 Tiptap doc 提取 plain text 与 assetIds（mention 节点顺序、去重）；运行 `pnpm --filter @aigc/web test -- segment-prompt-doc` 确认 RED
- [x] 4.3 实现 `apps/web/src/lib/segment-prompt-doc.ts` 提取/构建 util；确认测试 GREEN

## 5. 前端：API 客户端

- [x] 5.1 在 `apps/web/src/lib/__test__/api-client.test.ts` 写测试：`listAdoptedEntityImages`、`updateSegmentPrompt`、扩展 `generateSegmentVideo` 传 prompt/assetIds；运行 `pnpm --filter @aigc/web test -- api-client` 确认 RED
- [x] 5.2 在 `apps/web/src/lib/api-client.ts` 实现上述方法；确认测试 GREEN

## 6. 前端：SegmentPromptEditor 组件

- [x] 6.1 在 `apps/web/src/components/__test__/segment-prompt-editor.test.tsx` 写测试：`@` 触发下拉、选中插入 mention、onBlur 回调携带 doc/prompt/assetIds、初始 plain seedancePrompt 无预填 mention；运行 `pnpm --filter @aigc/web test -- segment-prompt-editor` 确认 RED
- [x] 6.2 新增 `AssetMentionList` + `SegmentPromptEditor`（Tiptap + mention extension）；确认测试 GREEN

## 7. 前端：SegmentCard 与 Edit 页集成

- [x] 7.1 在 `apps/web/src/components/__test__/segment-card.test.tsx` 写测试：无「部分参考图缺失」文案；集成 SegmentPromptEditor；AI 生成传递 prompt/assetIds；运行 `pnpm --filter @aigc/web test -- segment-card` 确认 RED
- [x] 7.2 重构 `SegmentCard`：移除 missingRefs；替换 textarea 为 SegmentPromptEditor；更新 `onGenerate` 签名；确认测试 GREEN
- [x] 7.3 在 `apps/web/src/app/(workspace)/short-video/[projectId]/edit/__test__/page.test.tsx` 更新测试：加载 adopted images、blur 触发 PATCH、generate 传 prompt/assetIds；运行 `pnpm --filter @aigc/web test -- edit/page` 确认 RED
- [x] 7.4 更新 `edit/page.tsx`：拉 adopted images、处理 blur save 与 generate；删除 segmentMissingRefs；全量 `pnpm test` 通过
