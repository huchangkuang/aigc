import { describe, expect, it } from 'vitest';
import { buildComposerDraft } from '@/lib/composer-draft';
import type { ComposeContext } from '@/lib/api-client';

const context: ComposeContext = {
  assetId: 'a1',
  assetType: 'video',
  prompt: '小猫',
  imageUrls: ['https://example.com/ref.png'],
  generationType: 'video_i2v_first',
  frames: 121,
  aspectRatio: '16:9',
  templateId: 'hitchcock_dolly_in',
  cameraStrength: 'medium',
  model: '1080',
};

describe('buildComposerDraft', () => {
  it('builds similar draft with all params', () => {
    expect(buildComposerDraft(context, 'similar')).toEqual({
      mode: 'similar',
      type: 'video_i2v_first',
      prompt: '小猫',
      imageUrls: ['https://example.com/ref.png'],
      frames: 121,
      aspectRatio: '16:9',
      templateId: 'hitchcock_dolly_in',
      cameraStrength: 'medium',
      model: '1080',
    });
  });

  it('builds image-only draft', () => {
    expect(buildComposerDraft(context, 'imageOnly')).toEqual({
      mode: 'imageOnly',
      imageUrls: ['https://example.com/ref.png'],
    });
  });

  it('builds prompt-only draft', () => {
    expect(buildComposerDraft(context, 'promptOnly')).toEqual({
      mode: 'promptOnly',
      prompt: '小猫',
    });
  });
});
