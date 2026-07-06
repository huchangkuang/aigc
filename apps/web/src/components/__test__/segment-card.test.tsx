import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SegmentCard } from '../segment-card';

vi.mock('../segment-prompt-editor', () => ({
  SegmentPromptEditor: ({
    onStateChange,
    onBlurSave,
  }: {
    onStateChange?: (payload: { prompt: string; assetIds: string[] }) => void;
    onBlurSave: (payload: unknown) => void;
  }) => (
    <div>
      <div data-testid="segment-prompt-editor">editor</div>
      <button
        type="button"
        onClick={() => {
          onStateChange?.({ prompt: 'edited prompt', assetIds: ['asset-1'] });
          onBlurSave({
            seedancePrompt: 'edited prompt',
            referenceAssetIds: ['asset-1'],
            seedancePromptDoc: { type: 'doc', content: [] },
          });
        }}
      >
        模拟编辑
      </button>
    </div>
  ),
}));

const segment = {
  id: 'seg1',
  order: 0,
  durationSec: 8,
  sceneDescription: '夜晚场景',
  characterRefIds: ['c1'],
  propRefIds: [],
  seedancePrompt: 'parsed prompt',
};

describe('SegmentCard', () => {
  it('does not show missing reference warning', () => {
    render(
      <SegmentCard
        segment={segment}
        index={0}
        mentionItems={[]}
        onBlurSave={vi.fn()}
        onGenerate={vi.fn()}
      />,
    );

    expect(screen.queryByText('部分参考图缺失')).not.toBeInTheDocument();
  });

  it('passes prompt and assetIds to onGenerate', () => {
    const onGenerate = vi.fn();
    render(
      <SegmentCard
        segment={segment}
        index={0}
        mentionItems={[]}
        onBlurSave={vi.fn()}
        onGenerate={onGenerate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '模拟编辑' }));
    fireEvent.click(screen.getByRole('button', { name: /AI 生成/ }));

    expect(onGenerate).toHaveBeenCalledWith({
      model: '2.0',
      prompt: 'edited prompt',
      assetIds: ['asset-1'],
    });
  });
});
