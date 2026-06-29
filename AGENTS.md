# AIGC Platform

基于 pnpm monorepo 的 AIGC 项目，包含 Next.js 前端与 NestJS 后端。

## 技术栈

| 层级 | 路径 | 技术 |
|------|------|------|
| 前端 | `apps/web/` | Next.js (App Router) + TypeScript + Tailwind CSS + Zustand |
| 后端 | `apps/api/` | NestJS + Prisma + MySQL + TypeScript |

## 测试

| 范围 | 框架 | 命令 |
|------|------|------|
| 前端 | Vitest + RTL | `pnpm --filter @aigc/web test` |
| 后端 | Jest | `pnpm --filter @aigc/api test` |
| 全量 | — | `pnpm test` |

测试文件统一放在源码同级的 `__test__/` 目录（前端 `*.test.ts(x)`，后端 `*.spec.ts`）。

## 前端编码规范

见 `apps/web/CLAUDE.md`（Claude Code）或 `.cursor/rules/react-component-conventions.mdc`（Cursor）。

## OpenSpec + Superpowers 工作流

1. Cursor Agent 安装 Superpowers：`/plugin-add superpowers`
2. `/opsx:propose "变更"` → `/opsx:apply` → `/opsx:archive`
3. apply 阶段遵循 TDD：先写失败测试 → 最少实现 → 验证通过

OpenSpec 项目上下文见 `openspec/config.yaml`。
