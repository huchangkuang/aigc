## Context

当前工作台：

- `/generate`：单次 GenerationTask（含 `video_seedance_r2v`）
- `/assets`：按 `type=image|video` 筛选；`Asset` 无来源字段
- Seedance 2.0 / fast / mini 已通过 `ArkVideoService` 接入
- 无 LLM、无项目实体、无分镜结构

产品决策（已确认）：

1. 不用 TipTap；分镜用结构化卡片
2. 产出多段独立视频，用户自行剪辑
3. 项目页内嵌套侧边栏：剧本 → 资产 → 视频编辑（自由切换，无 workflowStep）
4. 实体参考图手动生图；允许跳过资产生成直接分镜/生成
5. 全局资产库：来源（全部/素材/短视频）× 格式（全部/图片/视频）
6. 重新解析实体/分镜时**不清空**已有资产绑定与分镜（合并更新）
7. LLM 模型：`deepseek-chat`

## Goals / Non-Goals

**Goals:**

- 短视频项目端到端：剧本解析 → 实体生图 → 分镜解析 → 逐段 Seedance
- 项目数据持久化（剧本、entities JSON、segments JSON）
- 短视频产生的 Asset 在全局资产库可见且可筛选
- DeepSeek 调用仅在后端；JSON schema 校验 LLM 输出
- TDD：解析 prompt 组装、entity→prompt、segment→Ark payload 等纯函数可单测

**Non-Goals:**

- 视频合成、时间线、480P/720P 档位 UI
- 项目进度状态机、Stepper 锁定
- 全局跨项目角色库
- 自动批量生图

## Decisions

### 1. 路由与布局

**选择**：

```
/short-video                          项目列表
/short-video/[projectId]/script       剧本
/short-video/[projectId]/assets       资产
/short-video/[projectId]/edit         视频编辑
```

项目路由使用 `(project)/[projectId]/layout.tsx` 渲染**项目内侧边栏**；外层仍包在全局 `AppShell` 内（全局侧栏保留「短视频」入口）。

**理由**：与参考 UI 一致；三 Tab 独立 URL，刷新不丢当前 Tab。

### 2. 数据模型

**选择**：

```prisma
enum AssetSource {
  material
  short_video
}

model ShortVideoProject {
  id              String   @id @default(cuid())
  userId          String
  title           String
  rawScript       String   @db.Text
  parsedEntities  Json?    // { characters, scenes, props }
  segments        Json?    // { segments: [...] }
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(...)
}

model Asset {
  ...
  source AssetSource @default(material)
}
```

实体与片段结构存 JSON（MVP 不拆子表）：

```typescript
type ParsedEntity = {
  id: string
  kind: 'character' | 'scene' | 'prop'
  name: string
  description: string
  imagePrompt: string
  assetId?: string
  imageTaskId?: string
}

type Segment = {
  id: string
  order: number
  durationSec: number
  visualStyle?: string
  sceneDescription: string
  characterRefIds: string[]
  sceneRefId?: string
  propRefIds: string[]
  seedancePrompt: string
  model?: '2.0' | '2.0-fast' | '2.0-mini'
  videoTaskId?: string
  videoAssetId?: string
}
```

**理由**：YAGNI；JSON 足够 MVP；后续可规范化。

### 3. DeepSeek 集成

**选择**：NestJS `DeepSeekService`，OpenAI 兼容 `baseURL: https://api.deepseek.com`，`model: deepseek-chat`，`response_format: { type: 'json_object' }`（若 API 支持）。

两次独立调用：

| 端点 | 输入 | 输出 |
|------|------|------|
| `POST .../parse-entities` | rawScript | `{ characters, scenes, props }` |
| `POST .../parse-segments` | rawScript + parsedEntities | `{ segments }` |

System prompt 固定 + 用户剧本；输出经 Zod/class-validator 校验。

**理由**：后端持密钥；便于单测 mock。

### 4. 重新解析合并策略（不清空）

**选择**：

- **实体解析**：按 `id`（LLM 生成 stable id 或 name  slug）合并——已存在且含 `assetId` 的实体**保留** `assetId`/`imageTaskId`；新增实体追加；LLM 未返回的旧实体**保留**在列表中（不删除），避免误删已生图数据
- **分镜解析**：按 `segment.id` 或 `order` 合并——已有 `videoTaskId`/`videoAssetId` 的片段保留；新解析结果更新文案字段；用户可手动删除片段（P1 可选）

**理由**：符合「不用清空」；避免重复生图成本。

### 5. 资产生图与 Seedance 生成

**选择**：复用现有 `GenerationTaskService.create`：

- 实体生图：`type: image`，完成后 `AssetService` 写 `source: short_video`，`metadata: { projectId, entityId, entityKind, entityName, title }`；回写 entity `assetId`
- 片段视频：`type: video_seedance_r2v`，`image_urls` 从关联 entity 的 asset 取 signed URL（缺失则省略），`prompt` 用 `seedancePrompt`

Poller 完成后前端轮询或 WebSocket 非 MVP；沿用任务中心 + 项目页 refresh。

### 6. 资产库双维筛选

**选择**：`GET /assets?source=material|short_video&type=image|video`；参数均可选。

前端资产页两行 Tab 或 chip 组：来源一行、格式一行。

**理由**：用户明确要求两套维度并存。

### 7. 跳过资产门槛

**选择**：分镜解析与片段生成**不校验**实体是否均有 `assetId`；UI 对缺参考图的实体/片段显示警告 badge。

## Risks / Trade-offs

- **[Risk] LLM JSON 不稳定** → Zod 校验 + 友好错误 + 允许重试；prompt  few-shot 示例
- **[Risk] 合并解析导致 stale 实体** → 用户可手动编辑/删除实体（MVP 至少可编辑 prompt）
- **[Risk] 项目页组件膨胀** → 每 Tab 独立 page + 子组件（`EntityCard`、`SegmentCard`），单文件 ≤400 行
- **[Risk] JSON 存 segments 难以查询** → MVP 可接受；全量在 project GET 返回
- **[Trade-off] 无 workflowStep** → 用户可能未解析实体就进视频编辑；靠 UI 空状态引导

## Migration Plan

1. Prisma migration：`AssetSource` + `ShortVideoProject`；现有 `assets.source` 默认 `material`
2. 部署 API 前配置 `DEEPSEEK_API_KEY`
3. 前端随 API 一起发版；旧资产页仅多来源筛选，默认「全部」行为不变

## Open Questions

- 实体/片段手动删除是否在 MVP 提供（建议：实体可删，片段可删）
- 项目列表是否支持删除项目（建议：MVP 提供 DELETE）
