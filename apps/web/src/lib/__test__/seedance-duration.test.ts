import { describe, expect, it } from 'vitest';
import {
  listSeedanceDurationOptions,
  MAX_SEEDANCE_DURATION,
  MIN_SEEDANCE_DURATION,
} from '@/lib/seedance-duration';

describe('seedance-duration', () => {
  it('lists every whole second in the supported range', () => {
    const options = listSeedanceDurationOptions();
    expect(options[0]).toBe(MIN_SEEDANCE_DURATION);
    expect(options.at(-1)).toBe(MAX_SEEDANCE_DURATION);
    expect(options).toHaveLength(MAX_SEEDANCE_DURATION - MIN_SEEDANCE_DURATION + 1);
  });
});
