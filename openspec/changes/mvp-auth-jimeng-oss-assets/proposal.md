## Why

AIGC Platform 目前仅有 monorepo 脚手架，无法实际生成或管理 AI 素材。需要将即梦（火山引擎）图片/视频生成能力接入工作台，并通过预设账号登录保护开发者 API 经费；生成结果须持久化到阿里云 OSS（即梦临时 URL 1–24 小时过期），形成可用的「生成 → 存储 → 资产管理」闭环，作为后续短视频/短剧模块的基础。

## What Changes

- 实现预设账号登录（无公开注册），JWT 会话，所有业务 API 需认证
- 后端代理即梦 API（AK/SK 仅存服务端），支持五种生成能力：
  - 文生图（Seedream 4.6）
  - 文生视频 720P
  - 图生视频·首帧
  - 图生视频·首尾帧
  - 图生视频·运镜
- 异步任务提交与轮询，任务状态持久化
- 生成完成后自动下载并上传阿里云 OSS，写入资产记录
- 前端：登录页、素材生成页、任务状态、资产库列表与预览
- 扩展 Prisma 数据模型（User、GenerationTask、Asset）
- 新增环境变量配置（火山 AccessKey、OSS、JWT、预设用户）

**不在本变更范围：**

- 短视频脚本拆分、短剧模块、ffmpeg 拼接
- 公开注册 / 白名单管理 UI
- 轻量 CI/CD 轮询部署服务（独立项目，后续迭代）
- 生产环境去掉 Docker 的具体迁移（本变更兼容现有 docker-compose 本地开发）

## Capabilities

### New Capabilities

- `user-auth`: 预设账号 seed、登录、JWT 鉴权、路由保护
- `jimeng-generation`: 即梦五种生成能力提交、轮询、错误处理
- `oss-storage`: 阿里云 OSS 上传、路径规划、临时/永久对象管理
- `asset-library`: 资产生成入库、列表、筛选、预览与下载

### Modified Capabilities

（无现有 spec）

## Impact

- **apps/api**: 新增 Auth、Jimeng、Storage、Asset、GenerationTask 模块；Prisma schema 迁移；`.env` 扩展
- **apps/web**: 新增登录、生成、资产页面与布局；API 客户端与 auth store
- **依赖**: `@volcengine/openapi` 或自研签名、`ali-oss`、`@nestjs/jwt`、`bcrypt` 等
- **基础设施**: 需火山 AccessKey（已有）、阿里云 OSS Bucket（待创建）；Docker 继续用于本地开发，生产部署策略不在本变更实现
