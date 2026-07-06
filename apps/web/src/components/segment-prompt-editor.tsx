'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { AssetMention } from '@/components/asset-mention-extension';
import type { AdoptedEntityImageItem } from '@/lib/api-client';
import {
  extractSegmentPromptPayload,
  initialSegmentPromptDoc,
  type SegmentPromptDoc,
} from '@/lib/segment-prompt-doc';
import type { Segment } from '@/lib/short-video-types';

export type SegmentPromptEditorProps = {
  segment: Segment;
  mentionItems: AdoptedEntityImageItem[];
  onBlurSave: (payload: {
    seedancePrompt: string;
    referenceAssetIds: string[];
    seedancePromptDoc: SegmentPromptDoc;
  }) => void;
  onStateChange?: (payload: {
    prompt: string;
    assetIds: string[];
    doc: SegmentPromptDoc;
  }) => void;
};

export function SegmentPromptEditor({
  segment,
  mentionItems,
  onBlurSave,
  onStateChange,
}: SegmentPromptEditorProps) {
  const initialDoc = initialSegmentPromptDoc(
    segment.seedancePrompt,
    segment.seedancePromptDoc as SegmentPromptDoc | undefined,
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      AssetMention.configure({ mentionItems }),
    ],
    content: initialDoc,
    editorProps: {
      attributes: {
        class:
          'min-h-[88px] w-full rounded-lg border border-outline-variant/40 bg-surface-container-low/60 p-sm text-sm leading-relaxed text-on-surface outline-none focus:border-primary',
        'data-testid': `segment-prompt-editor-${segment.id}`,
      },
    },
    onUpdate: ({ editor: current }) => {
      const doc = current.getJSON() as SegmentPromptDoc;
      const payload = extractSegmentPromptPayload(doc);
      onStateChange?.({ prompt: payload.prompt, assetIds: payload.assetIds, doc });
    },
    onBlur: ({ editor: current }) => {
      const doc = current.getJSON() as SegmentPromptDoc;
      const payload = extractSegmentPromptPayload(doc);
      onBlurSave({
        seedancePrompt: payload.prompt,
        referenceAssetIds: payload.assetIds,
        seedancePromptDoc: doc,
      });
    },
  }, [segment.id, segment.seedancePrompt, segment.seedancePromptDoc, mentionItems]);

  if (!editor) {
    return null;
  }

  return (
    <div>
      <label
        htmlFor={`segment-prompt-${segment.id}`}
        className="text-label-sm mb-1 block font-medium text-on-surface-variant"
      >
        Seedance 提示词
      </label>
      <EditorContent id={`segment-prompt-${segment.id}`} editor={editor} />
    </div>
  );
}

export function getEditorPayload(editor: NonNullable<ReturnType<typeof useEditor>>) {
  const doc = editor.getJSON() as SegmentPromptDoc;
  const payload = extractSegmentPromptPayload(doc);
  return { ...payload, doc };
}
