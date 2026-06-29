## Context

项目为 pnpm monorepo：`apps/web`（Next.js App Router + Zustand）、`apps/api`（NestJS + Prisma + MySQL）。当前仅有空白首页与 health check，User 表无密码字段。

即梦 API 统一走火山 `visual.volcengineapi.com`，异步模式 `CVSync2AsyncSubmitTask` / `CVSync2AsyncGetResult`，Region `cn-north-1`、Service `cv`。五种能力通过不同 `req_key` 区分（见 `seedance3.0720p-image/`、`seedance3.0720p-video/` 文档）。

用户约束：

- 已有火山 AccessKey；OSS Bucket 待创建
- 注册策略 C：仅预设账号，后期可扩展
- MVP 不做短视频/ffmpeg；五种即梦能力全做
- Docker 用于本机练习构建推送/拉取；生产计划在廉价 VPS 上 git pull + `deploy.sh`，最终可能移除 Docker 部署方式（本变更保持 docker-compose 可本地跑，不绑定生产形态）

## Goals / Non-Goals

**Goals:**

- 预设用户可登录并使用工作台
- 五种即梦生成能力经后端代理可用
- 生成结果持久化 OSS，资产库可浏览
- 异步任务可查询状态（queued / processing / done / failed）
- TDD：关键路径有 Jest/Vitest 覆盖

**Non-Goals:**

- 短视频脚本拆分（DeepSeek/Dify）、短剧模块
- ffmpeg 视频拼接
- 公开注册、邀请码、白名单管理 UI
- 轻量 Jenkins 替代服务（Git 轮询 + deploy.sh）——建议独立仓库/变更
- OSS 生命周期规则自动化（可文档说明，实现阶段可选 `temp/` 前缀）
- 前端 STS 直传 OSS（MVP 走后端代理上传）

## Decisions

### 1. 认证：JWT + 预设用户 Seed

- **选择**: 启动时或 migration seed 从 `PRESET_USERS` 环境变量写入用户（email + bcrypt 密码）；无注册 API
- **理由**: 最简单保护即梦经费；与策略 C 一致
- **替代**: Session cookie（同源简单但 SSR/API 分离稍繁琐）

### 2. 即梦集成：NestJS JimengModule + 统一 Adapter

- **选择**: `JimengService` 封装签名、submit、poll；按 `GenerationType` 映射 `req_key` 与参数校验
- **req_key 映射**:

  | Type | req_key |
  |------|---------|
  | image | `jimeng_seedream46_cvtob` |
  | video_t2v | `jimeng_t2v_v30` |
  | video_i2v_first | `jimeng_i2v_first_v30` |
  | video_i2v_first_tail | `jimeng_i2v_first_tail_v30` |
  | video_i2v_recamera | `jimeng_i2v_recamera_v30` |

- **理由**: 五种 API 模式相同，差异仅在 body；便于测试 mock
- **替代**: 每类型独立 Service（重复多）

### 3. 任务轮询：NestJS Schedule + DB 状态机

- **选择**: 提交后在 `generation_tasks` 表记 `pending`；`@Interval` 或 cron 每 N 秒 poll 进行中任务；完成时触发 OSS 转存
- **理由**: MVP 无需 Redis/BullMQ；单实例 VPS 足够
- **替代**: BullMQ（更 robust，但增加 Redis 依赖，不适合 99 元 VPS MVP）

### 4. OSS：后端代理上传 + 路径约定

- **选择**: `ali-oss` SDK；路径 `assets/{userId}/{assetId}.{ext}`；用户参考图临时路径 `temp/{userId}/{uuid}.{ext}`
- **流程**: 即梦返回 URL → 后端 stream 下载 → `put` OSS → 存 Asset 记录
- **理由**: 用户熟悉 OSS 但无直传经验；后端代理实现简单
- **替代**: STS 临时凭证前端直传（省带宽，Phase 2 优化）

### 5. 数据模型

```
User
  id, email, passwordHash, createdAt, updatedAt

GenerationTask
  id, userId, type (enum), status (enum)
  jimengTaskId, reqKey, inputParams (Json)
  errorMessage, createdAt, updatedAt, completedAt

Asset
  id, userId, taskId (nullable)
  type (image|video), ossKey, mimeType
  metadata (Json: prompt, width, frames, etc.)
  createdAt
```

- 一任务可对应多 Asset（文生图可能多图）

### 6. 前端结构

- `/login` — 登录
- `/generate` — 类型选择 + 参数表单 + 最近任务
- `/assets` — 网格列表、类型筛选、预览/下载
- `(authenticated)` layout + middleware 检查 token
- Zustand `auth-store` 存 token；fetch 带 Authorization header

### 7. 部署策略（文档级，本变更不实现 CI 服务）

- **本地**: 现有 `docker-compose.dev.yml` 继续用于 MySQL + 可选全栈
- **生产（用户计划）**: VPS 上 git pull → 各项目 `deploy.sh`；多 database 隔离
- **轻量 CI 想法**: 独立小服务轮询 DB 中 git 仓库配置，有更新则 exec `deploy.sh`——**不纳入本变更**；内存占用远低于 Jenkins，适合 99 元机器，建议单独 `git-deploy-poller` 项目

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 即梦 URL 过期前未完成转存 | poll 完成后立即 download+upload；失败标记 task failed 可重试 |
| OSS 未配置阻塞开发 | 提供 `STORAGE_MOCK=true` 或 local fallback 仅 dev（可选） |
| 轮询单实例丢任务 | 任务状态在 DB；重启后继续 poll `processing` |
| 即梦 QPS/并发限流 | 捕获 50429/50430，指数退避重试 |
| AK/SK 泄露 | 仅后端 env；禁止前端暴露 |
| 无用 temp 文件占 OSS | 文档说明 lifecycle；后续加清理 job |
| Docker vs 非 Docker 双轨 | 本变更 env 驱动；deploy 脚本与 Docker 解耦 |

## Migration Plan

1. 添加 Prisma migration（User 密码、GenerationTask、Asset）
2. 配置 `.env`：火山 AK/SK、OSS、JWT_SECRET、PRESET_USERS
3. 部署 API → 运行 seed → 部署 Web
4. 验证：登录 → 文生图 → 资产库可见
5. 回滚：migration down + 移除新 env（无数据迁移依赖旧行为）

## Open Questions

- OSS Bucket 地域（建议与即梦/服务器同区域降低延迟）——用户研究中
- 即梦签名 SDK：Volcengine 官方 SDK vs 手写签名——实现时按文档选型
- 资产预览：OSS 私有桶 + 签名 URL vs 公共读——建议私有 + 短期 signed URL
