import { GenerationType } from '@prisma/client';

export type ModelOption = {
  id: string;
  label: string;
  reqKey: string;
};

export const MODEL_OPTIONS: Record<GenerationType, ModelOption[]> = {
  image: [
    { id: 'seedream46', label: 'Seedream 4.6', reqKey: 'jimeng_seedream46_cvtob' },
    { id: 'v31', label: '即梦 3.1', reqKey: 'jimeng_t2i_v31' },
    { id: 'v40', label: '即梦 4.0', reqKey: 'jimeng_t2i_v40' },
  ],
  video_t2v: [
    { id: '720', label: '720P', reqKey: 'jimeng_t2v_v30' },
    { id: '1080', label: '1080P', reqKey: 'jimeng_t2v_v30_1080p' },
    { id: 'pro', label: 'Pro', reqKey: 'jimeng_ti2v_v30_pro' },
  ],
  video_i2v_first: [
    { id: '720', label: '720P', reqKey: 'jimeng_i2v_first_v30' },
    { id: '1080', label: '1080P', reqKey: 'jimeng_i2v_first_v30_1080' },
    { id: 'pro', label: 'Pro', reqKey: 'jimeng_ti2v_v30_pro' },
  ],
  video_i2v_first_tail: [
    { id: '720', label: '720P', reqKey: 'jimeng_i2v_first_tail_v30' },
    { id: '1080', label: '1080P', reqKey: 'jimeng_i2v_first_tail_v30_1080' },
  ],
  video_i2v_recamera: [
    { id: '720', label: '720P', reqKey: 'jimeng_i2v_recamera_v30' },
  ],
};

const GENERATION_TYPES = new Set<string>(Object.keys(MODEL_OPTIONS));

export function isGenerationType(value: string): value is GenerationType {
  return GENERATION_TYPES.has(value);
}

function findModelOption(type: GenerationType, model?: string): ModelOption {
  const options = MODEL_OPTIONS[type];
  const id = model ?? options[0]?.id;
  const match = options.find((item) => item.id === id);
  if (!match) {
    throw new Error(`Invalid model "${model ?? ''}" for type "${type}"`);
  }
  return match;
}

export function resolveModelId(type: GenerationType, model?: string): string {
  return findModelOption(type, model).id;
}

export function resolveReqKey(type: GenerationType, model?: string): string {
  return findModelOption(type, model).reqKey;
}

export function listModelsForType(
  type: GenerationType,
): Array<{ id: string; label: string }> {
  return MODEL_OPTIONS[type].map(({ id, label }) => ({ id, label }));
}
