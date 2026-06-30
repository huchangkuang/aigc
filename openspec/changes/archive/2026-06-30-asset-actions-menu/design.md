## Context

资产页 `AssetCard` 的三点按钮为 `disabled`。后端 `GET /assets` 仅支持列表/详情/下载；资产 `metadata` 目前主要存 `prompt`，参考图在关联 `GenerationTask.inputParams.image_urls` 中。创作页 `/generate` 表单 state 为页面本地 state，无跨页预填机制。

用户已确认的产品决策：

| 问题 | 决策 |
|------|------|
| 「仅用图片」语义 | A：原始参考图（`task.inputParams.image_urls`） |
| 删除策略 | 软删（仅 DB 标记，保留 OSS） |
| 重命名 | 只改展示标题 `metadata.title`，不改 `metadata.prompt` |
| 同款生成 | 回填全部生成参数（type、prompt、参考图、frames 等）并跳转创作页 |

## Goals / Non-Goals

**Goals:**

- 资产卡片可操作：重命名、软删（二次确认）、三种「带回创作页」模式
- 标题展示优先级：`metadata.title` → `metadata.prompt` → 未命名图片/视频
- 同款/部分回填时参考图使用 fresh signed URL（避免过期）
- TDD 覆盖关键 API 与 UI 交互

**Non-Goals:**

- OSS 对象物理删除或生命周期清理
- 批量操作、回收站 UI、撤销删除
- 用视频输出本身作为参考图（即梦 i2v 不支持视频 URL 作参考）
- URL query 传递长 signed URL（改用 store + 可选 `assetId` 兜底）

## Decisions

### 1. 软删：`deletedAt` 字段

- **选择**: `Asset.deletedAt DateTime?`；`DELETE /assets/:id` 设为 `now()`；所有 list/get 默认 `deletedAt IS NULL`
- **理由**: 与用户对齐；OSS 保留便于误删恢复（后续可做回收站）
- **替代**: 硬删 + OSS delete（用户明确不要）

### 2. 重命名：`metadata.title`

- **选择**: `PATCH /assets/:id` body `{ title: string }` → merge 进 `metadata.title`
- **理由**: 与 prompt 解耦，生成语义不受影响
- **展示**: 卡片标题 `title ?? prompt ?? 未命名`

### 3. Compose 上下文 API

- **选择**: `GET /assets/:id/compose-context` 返回：

```typescript
{
  assetId: string;
  assetType: 'image' | 'video';
  prompt?: string;           // metadata.prompt
  imageUrls: string[];       // task.inputParams.image_urls，signed 刷新
  generationType?: string;   // task.type
  frames?: number;
  aspectRatio?: string;
  templateId?: string;
  cameraStrength?: string;
}
```

- **理由**: 菜单点击时一次拉齐所需数据；参考图 URL 在服务端重新签名
- **替代**: 前端分别调 asset + generation-task（多请求、列表缺 taskId）

### 4. 三种回填模式

| 模式 | prompt | imageUrls | generationType + 其他 params |
|------|--------|-----------|------------------------------|
| `similar` 同款生成 | ✓ | ✓ | ✓ 全部 |
| `imageOnly` 仅用图片 | ✗ 清空 | ✓ | ✗ 保持当前或默认 |
| `promptOnly` 仅用提示词 | ✓ | ✗ 清空 | ✗ |

- **仅用图片无参考图**: toast「该资产没有可用的参考图」，不跳转
- **仅用提示词无 prompt**: toast「该资产没有提示词」，不跳转

### 5. 跨页预填：Zustand `composerDraftStore`

- **选择**: 菜单 action 写入 draft → `router.push('/generate')` → 创作页 mount 读取 draft 并应用到 state → `clearDraft()`
- **Draft 结构**:

```typescript
type ComposerDraft = {
  mode: 'similar' | 'imageOnly' | 'promptOnly';
  type?: GenerationType;
  prompt?: string;
  imageUrls?: string[];
  aspectRatio?: string;
  frames?: number;
  templateId?: string;
  cameraStrength?: string;
};
```

- **理由**: 避免 URL 长度与 signed URL 过期；实现简单
- **替代**: 纯 URL `?assetId=&mode=`（可作为 Phase 2 深链，MVP 不必须）

### 6. UI 组件

- **AssetCardMenu**: 相对定位 dropdown，`stopPropagation` 防止触发 MediaPreview
- **ConfirmDialog**: portal + backdrop，复用于删除确认（风格对齐 MediaLightbox）
- **RenameDialog** 或 inline prompt：MVP 用简单 dialog 输入标题

## Risks / Trade-offs

- **[Risk] 老资产无 taskId / 无 inputParams** → 同款/仅用图片可能缺数据；Mitigation: 明确 toast + 菜单项 disable 态（无 prompt 时禁用「仅用提示词/同款」）
- **[Risk] 软删 OSS 堆积** → Mitigation: 文档说明，后续回收站/生命周期变更
- **[Risk] draft 未消费就离开页面** → Mitigation: 消费后立即 clear；下次进入 generate 不重复应用
- **[Risk] 菜单与 hover 下载按钮层级** → Mitigation: z-index 与 click 隔离

## Migration Plan

1. Prisma migration 添加 `Asset.deletedAt`
2. 部署 API（新端点向后兼容）
3. 部署 Web（菜单 + store + 创作页预填）
4. 无需数据回填；现有资产 `metadata.title` 为空则继续用 prompt 展示

## Open Questions

（均已由用户确认，无遗留）
