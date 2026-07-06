import { describe, expect, it } from 'vitest';
import {
  buildPlainTextDoc,
  extractSegmentPromptPayload,
  type SegmentPromptDoc,
} from '../segment-prompt-doc';

describe('segment-prompt-doc', () => {
  const docWithMentions: SegmentPromptDoc = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '写实风格，' },
          {
            type: 'assetMention',
            attrs: { assetId: 'asset-1', label: '陆远', previewUrl: 'https://img/1.png' },
          },
          { type: 'text', text: ' 走来' },
          {
            type: 'assetMention',
            attrs: { assetId: 'asset-1', label: '陆远', previewUrl: 'https://img/1.png' },
          },
        ],
      },
    ],
  };

  it('extracts plain text and deduped assetIds in order', () => {
    const result = extractSegmentPromptPayload(docWithMentions);
    expect(result.prompt).toBe('写实风格，陆远 走来陆远');
    expect(result.assetIds).toEqual(['asset-1']);
  });

  it('builds plain text doc from seedancePrompt', () => {
    const doc = buildPlainTextDoc('初始提示词');
    expect(doc).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '初始提示词' }] }],
    });
    expect(extractSegmentPromptPayload(doc).prompt).toBe('初始提示词');
    expect(extractSegmentPromptPayload(doc).assetIds).toEqual([]);
  });
});
