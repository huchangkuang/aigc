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
  video_seedance_r2v: [
    {
      id: '2.0',
      label: 'Seedance 2.0',
      reqKey: 'doubao-seedance-2-0-260128',
    },
    {
      id: '2.0-fast',
      label: 'Seedance 2.0 Fast',
      reqKey: 'doubao-seedance-2-0-fast-260128',
    },
    {
      id: '2.0-mini',
      label: 'Seedance 2.0 Mini',
      reqKey: 'doubao-seedance-2-0-mini-260615',
    },
  ],
};

export const DEFAULT_SEEDANCE_RESOLUTION = '720p';

const SEEDANCE_RESOLUTIONS: Record<string, readonly string[]> = {
  '2.0': ['480p', '720p', '1080p', '4k'],
  '2.0-fast': ['480p', '720p'],
  '2.0-mini': ['480p', '720p'],
};

export function listSeedanceResolutions(model = '2.0'): string[] {
  return [...(SEEDANCE_RESOLUTIONS[model] ?? SEEDANCE_RESOLUTIONS['2.0'])];
}

export function isValidSeedanceResolution(
  model: string | undefined,
  resolution: string,
): boolean {
  return listSeedanceResolutions(model).includes(resolution);
}

const ARK_REQ_KEY_PREFIX = 'doubao-seedance-';

export function isArkVideoReqKey(reqKey: string): boolean {
  return reqKey.startsWith(ARK_REQ_KEY_PREFIX);
}

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
