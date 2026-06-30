import { describe, expect, it } from 'vitest';
import { composerDraftStore, setComposerDraft } from '@/stores/composer-draft-store';

describe('composerDraftStore', () => {
  it('sets and consumes draft once', () => {
    composerDraftStore.clearDraft();
    setComposerDraft({ mode: 'promptOnly', prompt: '小猫' });

    expect(composerDraftStore.consumeDraft()).toEqual({
      mode: 'promptOnly',
      prompt: '小猫',
    });
    expect(composerDraftStore.consumeDraft()).toBeNull();
  });
});
