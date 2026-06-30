import type { GenerationType } from '@/components/generation-composer';

export type ComposerDraftMode = 'similar' | 'imageOnly' | 'promptOnly';

export type ComposerDraft = {
  mode: ComposerDraftMode;
  type?: GenerationType;
  prompt?: string;
  imageUrls?: string[];
  aspectRatio?: string;
  frames?: number;
  templateId?: string;
  cameraStrength?: string;
};

type ComposerDraftStore = {
  draft: ComposerDraft | null;
  setDraft: (draft: ComposerDraft) => void;
  consumeDraft: () => ComposerDraft | null;
  clearDraft: () => void;
};

let draftRef: ComposerDraft | null = null;

export const composerDraftStore: ComposerDraftStore = {
  get draft() {
    return draftRef;
  },
  setDraft(draft) {
    draftRef = draft;
  },
  consumeDraft() {
    const current = draftRef;
    draftRef = null;
    return current;
  },
  clearDraft() {
    draftRef = null;
  },
};

export function setComposerDraft(draft: ComposerDraft) {
  composerDraftStore.setDraft(draft);
}

export function consumeComposerDraft() {
  return composerDraftStore.consumeDraft();
}
