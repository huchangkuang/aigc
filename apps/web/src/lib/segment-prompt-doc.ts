export type SegmentPromptDoc = {
  type: 'doc';
  content: SegmentPromptBlock[];
};

type SegmentPromptBlock = {
  type: 'paragraph';
  content: SegmentPromptInline[];
};

type SegmentPromptInline =
  | { type: 'text'; text: string }
  | {
      type: 'assetMention';
      attrs: { assetId: string; label: string; previewUrl?: string };
    };

export function buildPlainTextDoc(text: string): SegmentPromptDoc {
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  };
}

export function extractSegmentPromptPayload(doc: SegmentPromptDoc) {
  let prompt = '';
  const assetIds: string[] = [];
  const seen = new Set<string>();

  for (const block of doc.content) {
    for (const inline of block.content ?? []) {
      if (inline.type === 'text') {
        prompt += inline.text;
      } else if (inline.type === 'assetMention') {
        prompt += inline.attrs.label;
        if (!seen.has(inline.attrs.assetId)) {
          seen.add(inline.attrs.assetId);
          assetIds.push(inline.attrs.assetId);
        }
      }
    }
  }

  return { prompt, assetIds };
}

export function initialSegmentPromptDoc(
  seedancePrompt: string,
  seedancePromptDoc?: SegmentPromptDoc,
): SegmentPromptDoc {
  if (seedancePromptDoc?.type === 'doc') {
    return seedancePromptDoc;
  }
  return buildPlainTextDoc(seedancePrompt);
}
