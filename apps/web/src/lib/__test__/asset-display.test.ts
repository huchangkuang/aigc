import { getAssetDisplayTitle } from '@/lib/asset-display';
import type { Asset } from '@/lib/api-client';
import { describe, expect, it } from 'vitest';

describe('getAssetDisplayTitle', () => {
  const base: Asset = {
    id: 'a1',
    type: 'image',
    mimeType: 'image/png',
    metadata: {},
    createdAt: '2026-06-30T00:00:00.000Z',
  };

  it('uses metadata title first', () => {
    expect(
      getAssetDisplayTitle({ ...base, metadata: { title: '展示名', prompt: 'prompt' } }),
    ).toBe('展示名');
  });

  it('falls back to prompt and default names', () => {
    expect(getAssetDisplayTitle({ ...base, metadata: { prompt: '一只猫' } })).toBe('一只猫');
    expect(getAssetDisplayTitle({ ...base, type: 'video', metadata: {} })).toBe('未命名视频');
  });
});
