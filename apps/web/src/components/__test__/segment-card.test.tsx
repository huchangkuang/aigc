import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SegmentCard } from '../segment-card';
import type { Segment } from '@/lib/short-video-types';

vi.mock('@/components/icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

const segment: Segment = {
  id: 's1',
  order: 1,
  durationSec: 8,
  sceneDescription: '场景描述',
  characterRefIds: [],
  propRefIds: [],
  seedancePrompt: 'prompt',
};

describe('SegmentCard', () => {
  it('shows generating overlay when generating', () => {
    render(
      <SegmentCard
        segment={segment}
        index={0}
        generating
        onGenerate={() => undefined}
      />,
    );

    expect(screen.getAllByText('生成中…').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTestId('icon-progress_activity').length).toBeGreaterThanOrEqual(1);
  });
});
