## 1. 共享基础设施

- [x] 1.1 在 `apps/web/src/lib/__test__/generation-task-poll.test.ts` 写测试：`useGenerationTaskPoll` 在 taskIds 有 active 任务时启动轮询，`listActiveTasks` 全部 settled 后调用 `onSettled`；运行 `pnpm --filter @aigc/web test -- generation-task-poll` 确认 RED
- [x] 1.2 实现 `apps/web/src/lib/use-generation-task-poll.ts`（5s 间隔，复用 `hasActiveTasks`）；在 `apps/web/src/lib/generation-output.ts` 导出 `GENERATION_TASK_POLL_INTERVAL_MS`；确认测试 GREEN
- [x] 1.3 在 `apps/web/src/lib/__test__/api-client.test.ts` 写测试：`getGenerationTask(id)` 请求 `GET /generation-tasks/:id`；运行 `pnpm --filter @aigc/web test -- api-client` 确认 RED
- [x] 1.4 在 `apps/web/src/lib/api-client.ts` 实现 `getGenerationTask`；确认测试 GREEN

## 2. 剧本页：同步解析 loading

- [x] 2.1 在 `apps/web/src/app/(workspace)/short-video/[projectId]/script/__test__/page.test.tsx` 写测试：点击解析后立即显示 spinner/loading 文案并 disable 按钮与 textarea；运行 `pnpm --filter @aigc/web test -- script/page` 确认 RED
- [x] 2.2 修改 `script/page.tsx`：`setParsing(true)` 置于 save+parse 之前；按钮加 `progress_activity` spinner；parsing 时 disable textarea；确认测试 GREEN

## 3. 资产页：生图任务轮询

- [x] 3.1 在 `apps/web/src/components/__test__/entity-image-preview.test.tsx` 写测试：`generating` prop 时显示 overlay；运行 `pnpm --filter @aigc/web test -- entity-image-preview` 确认 RED
- [x] 3.2 为 `EntityImagePreview` 增加 `generating` overlay；`EntityCard` 透传 `generating` prop；确认测试 GREEN
- [x] 3.3 在 `apps/web/src/app/(workspace)/short-video/[projectId]/assets/__test__/page.test.tsx` 写测试：generate 后 busy 保持至 task settled、mount 时恢复 `imageTaskId` 轮询、失败 toast；运行 `pnpm --filter @aigc/web test -- assets/page` 确认 RED
- [x] 3.4 修改 `assets/page.tsx`：集成 `useGenerationTaskPoll`、合并 submitting + task active 为 generating 态、settled 后 reload histories；确认测试 GREEN

## 4. 视频编辑页：解析 loading + 视频任务轮询

- [x] 4.1 在 `apps/web/src/components/__test__/segment-card.test.tsx` 写测试：`generating` prop 时视频区显示 overlay；运行 `pnpm --filter @aigc/web test -- segment-card` 确认 RED
- [x] 4.2 为 `SegmentCard` 增加 `generating` overlay 与按钮 spinner；确认测试 GREEN
- [x] 4.3 在 `apps/web/src/app/(workspace)/short-video/[projectId]/edit/__test__/page.test.tsx` 写测试：解析分镜 immediate loading；generate-video 轮询至 settled；mount 恢复 `videoTaskId` 轮询；运行 `pnpm --filter @aigc/web test -- edit/page` 确认 RED
- [x] 4.4 修改 `edit/page.tsx`：解析分镜 spinner + immediate parsing；集成 `useGenerationTaskPoll` 处理 segment video tasks；确认测试 GREEN

## 5. 验证

- [x] 5.1 全量 `pnpm test` 通过
