## Context

资产软删（`Asset.deletedAt`）与 `DELETE /assets/:id` 已在 `asset-actions-menu` 变更中落地；OSS 对象在软删时保留。上一轮 Non-Goals 明确包含「回收站 UI、撤销删除、OSS 物理删除」，现用户要求补齐回收站闭环。

当前前端侧边栏三项 nav（生成 / 任务 / 资产库），删除确认文案写「不可撤销」，与软删语义不符。`StorageService` 仅有 upload / signed URL，无 delete。

用户已确认的产品决策：

| 问题 | 决策 |
|------|------|
| 销毁语义 | 删除 DB 记录 + 删除 OSS 对象；关联 GenerationTask 保留 |
| 回收站卡片 | 保留预览、下载；菜单仅恢复 + 销毁 |
| 侧边栏位置 | 主 nav 第四项 |
| 路由 | `/trash` |
| 批量清空 | 不做 |
| 销毁确认 | 二次确认（强调不可逆） |

## Goals / Non-Goals

**Goals:**

- 侧边栏 `/trash` 回收站页，展示用户所有软删资产（类型筛选 + 关键词搜索）
- 回收站卡片：预览、下载、恢复、销毁（销毁二次确认）
- 后端：`GET /assets/trash`、`POST /assets/:id/restore`、`DELETE /assets/:id/permanent`
- `StorageService.deleteObject(ossKey)`，mock 模式 no-op
- 修正资产库软删确认文案为「移入回收站」
- TDD 覆盖 API 与关键 UI

**Non-Goals:**

- 清空回收站、批量恢复/销毁
- 回收站内同款生成 / 重命名 / compose-context
- OSS 生命周期规则或定时清理
- 分页（与现有资产库一致，MVP 全量列表）

## Decisions

### 1. API 路由

- **选择**:
  - `GET /assets/trash?type=image|video` — 列出 `deletedAt IS NOT NULL`，含 signed previewUrl
  - `POST /assets/:id/restore` — `deletedAt = null`，仅当记录已软删
  - `DELETE /assets/:id/permanent` — 先删 OSS，再 `prisma.asset.delete`
- **理由**: 语义清晰；`trash` 静态路由须注册在 `:id` 之前
- **替代**: `GET /assets?scope=trash`（query 易与 type 混淆）

### 2. 永久销毁顺序

- **选择**: OSS delete 成功 → DB delete；任一步失败则 500，不留下「DB 已删 OSS 仍在」或反之
- **理由**: 优先保证用户侧「销毁后资产库与回收站均不可见」；OSS 孤儿比 DB 孤儿更易后续清理
- **Mock 模式**: 跳过 OSS delete，仅删 DB

### 3. 前端页面与组件复用

- **选择**: 新建 `apps/web/src/app/(workspace)/trash/page.tsx`，结构镜像 `assets/page.tsx`；`AssetCard` 增加 `variant: 'library' | 'trash'`（默认 library）
  - `library`: 现有 `AssetCardMenu`（重命名、软删、compose）
  - `trash`: `TrashAssetCardMenu`（恢复、销毁）— 可内联于 `asset-card-menu.tsx` 或同文件 export，避免重复预览/下载 UI
- **理由**: 预览区与布局与资产库一致；菜单差异用 variant 隔离
- **替代**: 完全独立 `TrashAssetCard`（重复 MediaPreview / 下载按钮）

### 4. 侧边栏

- **选择**: `navLinks` 第四项 `{ href: '/trash', label: '回收站', icon: 'delete' }`
- **理由**: 用户指定主 nav；Material icon `delete` 或 `delete_outline` 表回收站

### 5. 确认文案

| 场景 | 文案要点 |
|------|----------|
| 资产库软删 | 「移入回收站，可在回收站恢复或永久销毁」 |
| 回收站销毁 | 「永久销毁，无法恢复，OSS 文件将删除」 |

### 6. Service 层辅助方法

- **选择**: `findTrashedForUser(userId, id)` — `where: { id, userId, deletedAt: { not: null } }`；restore / permanent delete 均通过此方法校验归属与状态
- **理由**: 与 `findActiveForUser` 对称，404 统一

## Risks / Trade-offs

- **[Risk] OSS delete 失败阻塞销毁** → 返回 5xx + 错误信息；记录仍留在回收站，用户可重试
- **[Risk] OSS 已手动删除但 DB 仍在** → deleteObject 对 NoSuchKey 视为成功（或 catch 404），继续删 DB
- **[Risk] 回收站卡片仍请求 compose-context** → trash variant 不暴露 compose 菜单项，无此请求
- **[Risk] 全量列表性能** → 与资产库相同假设；后续统一加分页

## Migration Plan

1. 部署 API（新端点向后兼容，无 schema 变更）
2. 部署 Web（sidebar + trash 页 + 文案）
3. 无需数据迁移；历史软删资产自动出现在回收站

## Open Questions

（均已由用户确认，无遗留）
