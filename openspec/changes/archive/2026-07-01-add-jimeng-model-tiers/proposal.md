## Why

即梦 API 已提供 1080P、Pro 及新版文生图模型（3.1 / 4.0），而平台目前仅对接 720P 档位的五个能力，无法在创作中心选择更高画质或新模型。需要在保留现有 720P 行为的前提下接入新档位，并通过统一配置避免 req_key 前后端不一致。

## What Changes

- **后端**：新增 `(type, model) → reqKey` 能力配置表，替代单一 `REQ_KEY_MAP`
- **后端**：`POST /generation-tasks` 请求体增加可选字段 `model`；缺省时默认为各能力的 720P / Seedream 4.6（与现行为兼容）
- **后端**：新增 `GET /generation/models?type=<GenerationType>`，返回该能力下可用模型/档位列表（id、label、reqKey 不暴露给客户端）
- **后端**：按 `(type, model)` 校验参数（Pro 文生视频需 aspect_ratio；Pro / 1080 图生首帧需 image_urls 等）
- **前端**：创作中心增加「模型/档位」PillSelect；选项从 API 拉取，切换能力类型时自动回落到首个可用档位
- **前端**：提交任务时携带 `model`；「做同款」预填时从任务 `inputParams.model` 恢复档位
- **数据**：`GenerationTask.inputParams` 持久化 `model` 字段；`reqKey` 列继续存储实际调用的 req_key；Prisma `GenerationType` enum 不变

**不在本变更范围：**

- inpaint（涂抹编辑）、视频翻译、动作模仿 / 数字人（需视频上传或定制 UI）
- 图片超分（tilesr）
- 即梦 4.0 的高级参数 UI（size / scale / force_single 等；后端可透传，前端先用默认值）
- 全量 JSON Schema 动态表单引擎
- 按用户/套餐动态开放能力

## Capabilities

### New Capabilities

（无——行为扩展归入现有 jimeng-generation）

### Modified Capabilities

- `jimeng-generation`: 多模型档位 req_key 映射、models 查询接口、创建任务时的 model 字段与校验
- `generation-composer-prefill`: 「做同款」预填须包含 model 档位

## Impact

- **apps/api**: `jimeng.types.ts`（或新 `generation-capabilities.ts`）、`generation-task.service.ts`、`create-generation-task.dto.ts`、新增 controller 端点、单元/e2e 测试
- **apps/web**: `generation-composer.tsx`、`generate/page.tsx`、`api-client.ts`、`composer-draft-store` / `composer-draft.ts`、相关测试
- **openspec/specs**: `jimeng-generation`、`generation-composer-prefill` delta
- **数据库**: 无 schema migration（model 存于 inputParams JSON）
- **兼容性**: 不传 `model` 的旧客户端请求行为不变（默认 720P / Seedream 4.6）
