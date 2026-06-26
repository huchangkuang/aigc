# AIGC Platform

基于 pnpm monorepo 的 AIGC 项目，包含 Next.js 前端与 NestJS 后端。

## 技术栈

| 层级 | 技术 |
|------|------|
| 包管理 | pnpm workspace |
| 前端 | Next.js、Tailwind CSS、Zustand、TypeScript |
| 后端 | NestJS、Prisma、MySQL、TypeScript |
| 部署 | Docker Compose |

## 项目结构

```
aigc/
├── apps/
│   ├── web/          # Next.js 前端
│   └── api/          # NestJS 后端
├── docker/           # Docker 构建文件
├── docker-compose.yml
└── docker-compose.dev.yml
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

### 3. 启动 MySQL（Docker）

```bash
docker compose up mysql -d
```

### 4. 数据库迁移

```bash
pnpm --filter @aigc/api prisma:migrate
```

### 5. 本地开发

```bash
# 同时启动前后端
pnpm dev

# 或分别启动
pnpm dev:web   # http://localhost:3000
pnpm dev:api   # http://localhost:3001
```

## Docker 部署

### 生产构建

```bash
docker compose up -d --build
```

### 开发模式（热更新）

```bash
pnpm docker:dev
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 并行启动前后端开发服务 |
| `pnpm build` | 构建所有应用 |
| `pnpm lint` | 运行 ESLint |
| `pnpm --filter @aigc/api prisma:studio` | 打开 Prisma Studio |
| `pnpm docker:up` | Docker 启动全部服务 |
| `pnpm docker:down` | 停止 Docker 服务 |

## 端口

| 服务 | 默认端口 |
|------|----------|
| Web | 3000 |
| API | 3001 |
| MySQL | 3307（宿主机映射，容器内仍为 3306） |
