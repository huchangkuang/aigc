import { describe, expect, it } from 'vitest';
import {
  collectOutputAssets,
  getLatestOutputAsset,
  hasActiveTasks,
  resolveSessionSubmitMessage,
} from '@/lib/generation-output';
import type { GenerationTask } from '@/lib/api-client';

const doneTask: GenerationTask = {
  id: 't1',
  type: 'video',
  status: 'done',
  inputParams: { prompt: '小猫' },
  createdAt: '2026-06-29T10:00:00.000Z',
  assets: [
    {
      id: 'a1',
      type: 'video',
      previewUrl: 'https://example.com/a1.mp4',
      mimeType: 'video/mp4',
      metadata: { prompt: '小猫' },
      createdAt: '2026-06-29T10:01:00.000Z',
    },
  ],
};

describe('generation-output', () => {
  it('detects active tasks', () => {
    expect(hasActiveTasks([doneTask])).toBe(false);
    expect(
      hasActiveTasks([
        { ...doneTask, id: 't2', status: 'processing', assets: [] },
      ]),
    ).toBe(true);
  });

  it('collects previewable assets from completed tasks', () => {
    expect(collectOutputAssets([doneTask])).toHaveLength(1);
    expect(getLatestOutputAsset([doneTask])?.id).toBe('a1');
  });

  it('resolves submit message after session tasks finish', () => {
    expect(resolveSessionSubmitMessage([{ ...doneTask, status: 'processing' }])).toBeNull();
    expect(resolveSessionSubmitMessage([doneTask])).toBe('生成完成');
    expect(
      resolveSessionSubmitMessage([{ ...doneTask, status: 'failed', assets: [] }]),
    ).toBe('生成失败，请重试');
  });
});
