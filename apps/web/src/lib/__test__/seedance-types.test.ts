import { describe, expect, it } from 'vitest';
import {
  isSeedanceGenerationType,
  maxSeedanceReferenceImages,
} from '@/lib/seedance-types';

describe('seedance-types', () => {
  it('detects seedance generation types', () => {
    expect(isSeedanceGenerationType('video_seedance_t2v')).toBe(true);
    expect(isSeedanceGenerationType('video_t2v')).toBe(false);
  });

  it('limits reference images per seedance mode', () => {
    expect(maxSeedanceReferenceImages('video_seedance_i2v_first')).toBe(1);
    expect(maxSeedanceReferenceImages('video_seedance_i2v_first_tail')).toBe(2);
    expect(maxSeedanceReferenceImages('video_seedance_r2v')).toBe(14);
  });
});
