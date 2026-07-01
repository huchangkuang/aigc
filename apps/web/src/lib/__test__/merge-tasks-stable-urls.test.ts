import { describe, expect, it } from 'vitest';
import { mergeTasksWithStableUrls } from '../merge-tasks-stable-urls';
import type { GenerationTask } from '@/lib/api-client';

const baseTask = (overrides: Partial<GenerationTask> = {}): GenerationTask => ({
  id: 't1',
  type: 'image',
  status: 'done',
  inputParams: {},
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('mergeTasksWithStableUrls', () => {
  it('keeps previous previewUrl when asset id and ossKey are unchanged', () => {
    const prev = [
      baseTask({
        assets: [
          {
            id: 'a1',
            type: 'image',
            ossKey: 'assets/u1/a1.png',
            previewUrl: 'https://stable.example/a1.png',
            mimeType: 'image/png',
            metadata: {},
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    ];
    const next = [
      baseTask({
        assets: [
          {
            id: 'a1',
            type: 'image',
            ossKey: 'assets/u1/a1.png',
            previewUrl: 'https://fresh.example/a1.png',
            mimeType: 'image/png',
            metadata: {},
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    ];

    const merged = mergeTasksWithStableUrls(prev, next);
    expect(merged[0].assets?.[0].previewUrl).toBe('https://stable.example/a1.png');
  });

  it('uses new previewUrl for newly appeared assets', () => {
    const prev = [baseTask({ assets: [] })];
    const next = [
      baseTask({
        assets: [
          {
            id: 'a2',
            type: 'video',
            ossKey: 'assets/u1/a2.mp4',
            previewUrl: 'https://fresh.example/a2.mp4',
            mimeType: 'video/mp4',
            metadata: {},
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    ];

    const merged = mergeTasksWithStableUrls(prev, next);
    expect(merged[0].assets?.[0].previewUrl).toBe('https://fresh.example/a2.mp4');
  });
});
