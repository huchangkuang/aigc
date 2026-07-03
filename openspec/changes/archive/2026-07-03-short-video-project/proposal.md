## Why

平台已接入 Seedance 2.0 多模态视频生成，但「素材生成」页面向单次任务，无法支撑短视频创作中「剧本 → 角色/场景/道具参考图 → 分镜 → 逐段生成」的工作流。需要独立的短视频项目模块，用 DeepSeek 解析剧本并串联现有生图与 Seedance 能力，产出多段独立视频片段供用户自行剪辑。

## What Changes

- **全局导航**：侧边栏新增「短视频」，进入项目列表页
- **项目 CRUD**：创建/列表/打开独立项目；项目内嵌套侧边栏三 Tab：**剧本**、**资产**、**视频编辑**（Tab 间自由切换，无强制步骤顺序）
- **剧本 Tab**：输入/保存剧本；调用 DeepSeek（`deepseek-chat`）解析角色、场景、道具实体列表
- **资产 Tab**：展示解析出的实体；用户**手动**逐条触发生图（复用即梦 `image` 任务）；生成图绑定实体并写入全局资产库（来源标记为短视频）
- **视频编辑 Tab**：调用 DeepSeek 解析分镜片段（结构化卡片，无 TipTap）；允许在参考图未齐全时解析/生成（仅 UI 提示）；每段独立触发 Seedance（2.0 / 2.0-fast / 2.0-mini）生成视频
- **重新解析**：再次解析实体或分镜时**不自动清空**已有资产生图结果与分镜数据（增量/合并策略见 design）
- **资产库**：`GET /assets` 支持 **来源**（全部 / 素材 / 短视频）与 **格式**（全部 / 图片 / 视频）双维筛选
- **数据模型**：新增 `ShortVideoProject`；`Asset` 新增 `source` 字段；项目内 `parsedEntities`、`segments` 存 JSON

**不在本变更范围：**

- TipTap 富文本编辑器
- 视频合成/时间线/导出成片
- 项目成员、项目设置
- 跨项目全局角色库复用
- 片段多版本轮播、点数计费展示
- `deepseek-v4-pro`（本变更固定 `deepseek-chat`）

## Capabilities

### New Capabilities

- `short-video-project`: 短视频项目列表、项目内三 Tab 工作流、DeepSeek 剧本/分镜解析、实体手动生图与片段 Seedance 生成

### Modified Capabilities

- `asset-library`: 资产来源维度（material / short_video）及前端来源 × 格式双筛选

## Impact

- **apps/api**: 新 `ShortVideoModule`、`DeepSeekModule`（或 `ScriptLlmService`）；Prisma 迁移（`ShortVideoProject`、`Asset.source`）；`.env.example` 增加 `DEEPSEEK_API_KEY`；复用 `GenerationTaskService`、`AssetService`、`ArkVideoService`
- **apps/web**: 新路由 `/short-video`、`/short-video/[projectId]/{script,assets,edit}`；`AppShell` 导航；资产页双维筛选；`api-client` 扩展
- **依赖**: 后端新增 OpenAI SDK（DeepSeek 兼容接口）或 `fetch` 直调
- **兼容性**: 现有资产默认 `source=material`；素材生成与任务中心行为不变
