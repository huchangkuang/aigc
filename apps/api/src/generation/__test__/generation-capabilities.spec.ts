import { GenerationType } from '@prisma/client';
import {
  listModelsForType,
  resolveModelId,
  resolveReqKey,
} from '../generation-capabilities';

describe('generation-capabilities', () => {
  it('defaults to legacy tier when model omitted', () => {
    expect(resolveReqKey('video_t2v')).toBe('jimeng_t2v_v30');
    expect(resolveModelId('video_t2v')).toBe('720');
    expect(resolveReqKey('image')).toBe('jimeng_seedream46_cvtob');
    expect(resolveModelId('image')).toBe('seedream46');
  });

  it('resolves 1080 and pro video tiers', () => {
    expect(resolveReqKey('video_t2v', '1080')).toBe('jimeng_t2v_v30_1080p');
    expect(resolveReqKey('video_t2v', 'pro')).toBe('jimeng_ti2v_v30_pro');
    expect(resolveReqKey('video_i2v_first', '1080')).toBe(
      'jimeng_i2v_first_v30_1080',
    );
    expect(resolveReqKey('video_i2v_first_tail', '1080')).toBe(
      'jimeng_i2v_first_tail_v30_1080',
    );
  });

  it('resolves image model tiers', () => {
    expect(resolveReqKey('image', 'v31')).toBe('jimeng_t2i_v31');
    expect(resolveReqKey('image', 'v40')).toBe('jimeng_t2i_v40');
  });

  it('throws for invalid model', () => {
    expect(() => resolveReqKey('video_t2v', 'invalid')).toThrow(
      'Invalid model',
    );
  });

  it('lists public model options without reqKey', () => {
    expect(listModelsForType('video_t2v')).toEqual([
      { id: '720', label: '720P' },
      { id: '1080', label: '1080P' },
      { id: 'pro', label: 'Pro' },
    ]);
    expect(listModelsForType('video_i2v_recamera')).toEqual([
      { id: '720', label: '720P' },
    ]);
  });

  it('covers all generation types', () => {
    const types: GenerationType[] = [
      'image',
      'video_t2v',
      'video_i2v_first',
      'video_i2v_first_tail',
      'video_i2v_recamera',
    ];
    for (const type of types) {
      expect(listModelsForType(type).length).toBeGreaterThan(0);
      expect(resolveReqKey(type)).toBeTruthy();
    }
  });
});
