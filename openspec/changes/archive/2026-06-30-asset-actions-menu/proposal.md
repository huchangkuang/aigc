## Why

资产画廊卡片上的「更多」菜单目前是 disabled 占位，用户无法重命名、删除资产，也无法将历史生成参数带回创作中心再次编辑或复用。这阻断了「浏览 → 再创作」的核心工作流。

## What Changes

- 资产卡片启用三点菜单，提供：重命名、删除、同款生成、仅用图片、仅用提示词
- 删除采用**软删**（数据库标记，不删 OSS 对象），删除前二次确认
- 重命名仅更新展示标题（`metadata.title`），不修改原始 `metadata.prompt`
- 「仅用图片」回填生成任务中的**原始参考图**（`task.inputParams.image_urls`）；无参考图时 toast 提示
- 「同款生成」回填完整生成参数（type、prompt、参考图、frames、aspect_ratio、运镜参数等）并跳转 `/generate`
- 后端新增资产 PATCH（重命名）、DELETE（软删）、compose-context 接口
- 前端新增 Zustand composer draft store，创作页 mount 时消费并预填表单
- 新增 ConfirmDialog、AssetCardMenu 组件

## Capabilities

### New Capabilities

- `generation-composer-prefill`: 从资产菜单将 prompt / 参考图 / 完整任务参数预填到创作中心表单

### Modified Capabilities

- `asset-library`: 扩展资产管理能力（重命名、软删、compose 上下文 API、卡片操作菜单 UI）

## Impact

- **apps/api**: Prisma `Asset` 增加 `deletedAt`；AssetService/Controller 扩展 PATCH、DELETE、compose-context；列表默认过滤已软删
- **apps/web**: `asset-card.tsx` 菜单与确认弹窗；`composer-draft-store`；`generate/page.tsx` 读取 draft；`api-client` 新方法
- **测试**: 后端 asset service/controller spec；前端 menu、confirm dialog、draft store、generate page 预填测试
