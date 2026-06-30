# AIGC Platform

基于 pnpm monorepo 的 AIGC 项目，包含 Next.js 前端与 NestJS 后端。

## 技术栈

| 层级 | 技术 |
|------|------|
| 包管理 | pnpm workspace |
| 前端 | Next.js、Tailwind CSS、Zustand、TypeScript |
| 后端 | NestJS、Prisma、MySQL、TypeScript |
| 部署 | git pull + 构建 + pm2（或同类进程管理） |

## 项目结构

```
aigc/
├── apps/
│   ├── web/          # Next.js 前端
│   └── api/          # NestJS 后端
└── openspec/         # OpenSpec 变更管理
```

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

在 `apps/api/.env` 中配置 `DATABASE_URL`（个人练手可用本机 MySQL `root` 用户）。

### 3. 数据库迁移

```bash
pnpm --filter @aigc/api prisma:migrate
```

### 4. 本地开发

```bash
# 同时启动前后端
pnpm dev

# 或分别启动
pnpm dev:web   # http://localhost:3000
pnpm dev:api   # http://localhost:3001
```

登录页：`http://localhost:3000/login`，使用 `PRESET_USERS` 中配置的邮箱密码。

## MVP 工作台

当前 MVP 包含：

- 预设账号登录（无公开注册）
- 即梦五种生成：文生图、文生视频、图生视频（首帧 / 首尾帧 / 运镜）
- 异步任务轮询与状态展示
- 生成结果转存阿里云 OSS 并进入资产库

### 环境变量（`apps/api/.env`）

| 变量 | 说明 |
|------|------|
| `PRESET_USERS` | 预设账号，格式 `email:password`，多个用逗号分隔 |
| `JWT_SECRET` | JWT 签名密钥 |
| `VOLCENGINE_ACCESS_KEY_ID` / `VOLCENGINE_SECRET_ACCESS_KEY` | 火山引擎即梦 API 凭证 |
| `OSS_REGION` / `OSS_BUCKET` / `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET` | 阿里云 OSS |
| `STORAGE_MOCK=true` | 本地开发跳过真实 OSS（即梦结果不落盘，仅适合测 UI） |

即梦 API 文档见项目根目录 `seedance3.0720p-image/`、`seedance3.0720p-video/`。

### API 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/login` | 登录（公开），返回 `{ code: 0, data: { accessToken, user } }` |
| GET | `/health` | 健康检查（公开） |

所有接口 HTTP 状态码均为 **200**；业务成败看 body 里的 `code`（`0` 成功，非 `0` 失败，读 `message`）。
| POST | `/generation-tasks` | 提交生成任务 |
| GET | `/generation-tasks` | 任务列表 |
| GET | `/assets` | 资产列表 |
| POST | `/storage/upload` | 上传参考图 |

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 并行启动前后端开发服务 |
| `pnpm build` | 构建所有应用 |
| `pnpm test` | 运行全部单测（web: Vitest，api: Jest） |
| `pnpm test:watch` | 监听模式运行单测 |
| `pnpm lint` | 运行 ESLint |
| `pnpm --filter @aigc/api prisma:studio` | 打开 Prisma Studio |
| `pnpm --filter @aigc/api prisma:migrate:deploy` | 生产环境应用迁移 |

## OpenSpec + Superpowers 工作流

1. Cursor Agent 安装 Superpowers 插件：`/plugin-add superpowers`（安装后重启）
2. `/opsx:propose "变更描述"` — 生成 proposal、design、tasks
3. `/opsx:apply` — TDD 实现（先写失败测试，再写代码）
4. `/opsx:archive` — 归档变更

项目上下文与 TDD 规则见 `openspec/config.yaml`。

## 端口

| 服务 | 默认端口 |
|------|----------|
| Web | 3000 |
| API | 3001 |
| MySQL | 3306（本机 MySQL，见 `DATABASE_URL`） |
