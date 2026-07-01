## Why

资产软删已在上一轮实现，但用户删除后无法查看、恢复或彻底清理，且删除确认文案误导为「不可撤销」。回收站是软删设计的自然延伸，完成「误删可恢复、确认后可销毁」的闭环。

## What Changes

- 侧边栏主 nav 增加第四项「回收站」，路由 `/trash`
- 回收站页展示当前用户所有 `deletedAt IS NOT NULL` 的资产（类型筛选、关键词搜索，与资产库一致）
- 回收站卡片支持预览、下载，操作菜单提供「恢复」与「销毁」（销毁二次确认）
- 后端新增：列出回收站、恢复、永久销毁 API；销毁时删除 DB 记录并删除 OSS 对象
- 资产库删除确认文案改为「移入回收站」
- 不提供「清空回收站」等批量操作

## Capabilities

### New Capabilities

（无 — 回收站能力归入现有 asset-library 与 oss-storage）

### Modified Capabilities

- `asset-library`: 回收站列表/恢复/永久销毁 API；回收站前端页面与卡片菜单；软删确认文案修正
- `oss-storage`: 新增 OSS 对象删除能力，供永久销毁调用

## Impact

- **apps/api**: `AssetService` / `AssetController` 扩展 trash list、restore、permanent delete；`StorageService` 增加 `deleteObject`；路由 `GET /assets/trash` 须注册于 `GET /assets/:id` 之前
- **apps/web**: `app-shell.tsx` 侧边栏；`/trash` 页面；`AssetCard` 或 trash variant 菜单；`api-client` 新方法；`asset-card-menu.tsx` 删除文案
- **测试**: 后端 asset + storage spec；前端 trash 页、trash 菜单、sidebar 导航测试
