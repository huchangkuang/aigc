import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SegmentPromptEditor } from '../segment-prompt-editor';

const mentionItems = [
  {
    assetId: 'asset-1',
    entityId: 'c1',
    entityName: '陆远',
    entityKind: 'character' as const,
    previewUrl: 'https://img/1.png',
  },
];

const segment = {
  id: 'seg1',
  order: 0,
  durationSec: 8,
  sceneDescription: 'scene',
  characterRefIds: [],
  propRefIds: [],
  seedancePrompt: '初始提示词',
};

describe('SegmentPromptEditor', () => {
  it('renders initial plain seedancePrompt without mention chips', async () => {
    render(
      <SegmentPromptEditor
        segment={segment}
        mentionItems={mentionItems}
        onBlurSave={vi.fn()}
      />,
    );

    expect(await screen.findByText('初始提示词')).toBeInTheDocument();
    expect(screen.queryByText('@陆远')).not.toBeInTheDocument();
  });

  it('calls onBlurSave with doc payload', async () => {
    const onBlurSave = vi.fn();
    render(
      <SegmentPromptEditor
        segment={segment}
        mentionItems={mentionItems}
        onBlurSave={onBlurSave}
      />,
    );

    const editor = await screen.findByTestId('segment-prompt-editor-seg1');
    fireEvent.focus(editor);
    fireEvent.blur(editor);

    await waitFor(() => {
      expect(onBlurSave).toHaveBeenCalledWith(
        expect.objectContaining({
          seedancePrompt: '初始提示词',
          referenceAssetIds: [],
          seedancePromptDoc: expect.objectContaining({ type: 'doc' }),
        }),
      );
    });
  });
});
