## Context

当前生成流程采用「能力类型 × 硬编码 req_key」：

- Prisma `GenerationType` 五个 enum 值（image、video_t2v、video_i2v_first、video_i2v_first_tail、video_i2v_recamera）
- `REQ_KEY_MAP` 在 `jimeng.types.ts` 中一对一映射到 720P / Seedream 4.6 的 req_key
- 前端 `GENERATION_TYPES` 硬编码标签；参数 UI 按 type 字符串条件渲染
- `GenerationTask` 已独立存储 `reqKey`，适合记录实际 API 调用而不膨胀 enum

新文档（`seedance-new-md/`）提供 1080P、Pro 及文生图新模型。产品决策：

1. 720P 保留，新档位并存
2. 能力入口不合并（文生视频 / 图生首帧仍为独立 tab）；Pro 作为档位选项
3. inpaint、视频翻译、数字人等暂不接入
4. 个人使用，无需权限分级

## Goals / Non-Goals

**Goals:**

- 后端单文件配置 `(type, model) → reqKey`，作为唯一数据源
- `GET /generation/models?type=` 供前端动态渲染档位下拉
- `POST /generation-tasks` 支持 `model` 字段，默认行为与现网一致
- 前端增加模型/档位 PillSelect，切换 type 时自动校正 model
- 「做同款」预填恢复 model
- TDD：每个关键 `(type, model)` 组合有 req_key 解析测试

**Non-Goals:**

- 通用 JSON Schema 表单引擎
- inpaint / 视频翻译 / 动作模仿 / 超分
- v4.0 完整参数 UI（size、scale 等后续迭代）
- Prisma enum 扩展或 DB migration
- 暴露 req_key 给客户端

## Decisions

### 1. 二维模型：`type`（能力）+ `model`（档位）

**选择**：保持 `GenerationType` 不变，新增请求字段 `model: string`。

**理由**：避免 enum 从 5 扩到 15+；历史任务已有 `reqKey` 可审计；与「入口不合并、Pro 作档位」一致。

**替代方案**：每个档位独立 enum 值 —  rejected，migration 与前端分支爆炸。

### 2. 配置结构与 req_key 映射表

**选择**：`apps/api/src/generation/generation-capabilities.ts`

```typescript
export type ModelOption = { id: string; label: string; reqKey: string };

export const MODEL_OPTIONS: Record<GenerationType, ModelOption[]> = {
  image: [
    { id: 'seedream46', label: 'Seedream 4.6', reqKey: 'jimeng_seedream46_cvtob' },
    { id: 'v31',        label: '即梦 3.1',     reqKey: 'jimeng_t2i_v31' },
    { id: 'v40',        label: '即梦 4.0',     reqKey: 'jimeng_t2i_v40' },
  ],
  video_t2v: [
    { id: '720',  label: '720P',  reqKey: 'jimeng_t2v_v30' },
    { id: '1080', label: '1080P', reqKey: 'jimeng_t2v_v30_1080p' },
    { id: 'pro',  label: 'Pro',   reqKey: 'jimeng_ti2v_v30_pro' },
  ],
  video_i2v_first: [
    { id: '720',  label: '720P',  reqKey: 'jimeng_i2v_first_v30' },
    { id: '1080', label: '1080P', reqKey: 'jimeng_i2v_first_v30_1080' },
    { id: 'pro',  label: 'Pro',   reqKey: 'jimeng_ti2v_v30_pro' },
  ],
  video_i2v_first_tail: [
    { id: '720',  label: '720P',  reqKey: 'jimeng_i2v_first_tail_v30' },
    { id: '1080', label: '1080P', reqKey: 'jimeng_i2v_first_tail_v30_1080' },
  ],
  video_i2v_recamera: [
    { id: '720', label: '720P', reqKey: 'jimeng_i2v_recamera_v30' },
  ],
};
```

**辅助函数**：`resolveReqKey(type, model?)` — model 缺省时取数组第一项（720 / seedream46）；非法组合抛 400。

**替代方案**：YAML 外置配置 — rejected，个人项目 YAGNI，TS 常量类型更安全。

### 3. API 设计

| 端点 | 说明 |
|------|------|
| `GET /generation/models?type=video_t2v` | 返回 `{ id, label }[]`，不含 reqKey |
| `POST /generation-tasks` | body 增加可选 `model`；写入 `inputParams.model` 与 `reqKey` |

**默认**：省略 `model` → 与现网相同 req_key（配置表第一项）。

### 4. 校验规则（按 type + model，非通用引擎）

沿用现有 `validateDto` 分支，补充：

| 条件 | 规则 |
|------|------|
| i2v 类 type | 必须 `image_urls`（Pro 图生首帧同） |
| first_tail | 恰好 2 张图 |
| recamera | template_id + camera_strength |
| video_t2v（含 Pro 文生） | aspect_ratio 可选，UI 仍展示 |
| Pro + video_t2v | 无 image_urls |
| image v40/v31 | prompt 必填；image_urls 可选（0–10），本期 UI 不限制上限差异化 |

Pro 文生视频与图生首帧共用 `jimeng_ti2v_v30_pro`，靠 type 区分是否允许/要求 image_urls。

### 5. 前端：family 级 UI + API 驱动档位列表

**选择**：

- 能力类型下拉：继续硬编码 `GENERATION_TYPES`（5 项稳定）
- 模型 PillSelect：mount 时或 type 变化时 `GET /generation/models?type=`
- type 切换时若当前 model 不在新列表，reset 为 `options[0].id`
- 表单字段（aspect_ratio、frames、运镜）逻辑不变

**替代方案**：capabilities 含 fields schema 全动态渲染 — rejected，本期 YAGNI。

### 6. 移除 `REQ_KEY_MAP`

`REQ_KEY_MAP` 由 `generation-capabilities.ts` + `resolveReqKey` 替代；测试更新为矩阵断言。

### 7. Composer draft

`inputParams.model` 在任务详情中可读；「做同款」写入 draft 的 `model` 字段；generate page mount 时 `setModel`。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 前后端 model id 不一致 | 前端只使用 API 返回的 id，不硬编码档位列表 |
| Pro req_key 用于两种 type，历史展示混淆 | inputParams 存 type + model，reqKey 列精确记录 |
| v4.0 默认参数效果不可控 | 文档注明；后续单独变更暴露 UI |
| GET models 多一次请求 | 可 cache 于 page mount；5 个 type 数据量极小 |
| 旧任务无 inputParams.model | 展示时从 reqKey 反查或显示「默认」 |

## Migration Plan

1. 部署后端（兼容：无 model 字段请求仍走默认 req_key）
2. 部署前端（新 PillSelect + model 字段）
3. 无需 DB migration
4. 回滚： revert 前后端；旧任务 reqKey 仍有效

## Open Questions

- v4.0 是否需要在第一期支持 `force_single: true` 默认值（降低延迟/计费）？建议 apply 阶段默认不传，与 Seedream 行为一致。
- 任务列表/预览是否展示 model label？建议第一期仅在 composer 预填使用，列表可后续加。
