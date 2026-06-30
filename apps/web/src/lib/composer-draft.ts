import type { GenerationType } from '@/components/generation-composer';
import type { ComposeContext } from '@/lib/api-client';
import type { ComposerDraft, ComposerDraftMode } from '@/stores/composer-draft-store';

export function buildComposerDraft(
  context: ComposeContext,
  mode: ComposerDraftMode,
): ComposerDraft {
  if (mode === 'similar') {
    return {
      mode,
      type: context.generationType as GenerationType | undefined,
      prompt: context.prompt ?? '',
      imageUrls: context.imageUrls,
      aspectRatio: context.aspectRatio,
      frames: context.frames,
      templateId: context.templateId,
      cameraStrength: context.cameraStrength,
    };
  }

  if (mode === 'imageOnly') {
    return {
      mode,
      imageUrls: context.imageUrls,
    };
  }

  return {
    mode,
    prompt: context.prompt ?? '',
  };
}
