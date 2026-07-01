import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GeneratePage from '../page';
import { api } from '@/lib/api-client';
import { setComposerDraft, composerDraftStore } from '@/stores/composer-draft-store';

vi.mock('@/lib/api-client', () => ({
  api: {
    listTasks: vi.fn().mockResolvedValue([]),
    listActiveTasks: vi.fn().mockResolvedValue([]),
    createTask: vi.fn(),
    uploadReference: vi.fn(),
  },
}));

describe('GeneratePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listTasks).mockResolvedValue([]);
    vi.mocked(api.listActiveTasks).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders generation form', () => {
    render(<GeneratePage />);
    expect(screen.getByRole('heading', { name: '创作中心' })).toBeInTheDocument();
    expect(screen.getByText('开始生成')).toBeInTheDocument();
  });

  it('starts empty without loading historical tasks', async () => {
    vi.mocked(api.listTasks).mockResolvedValue([
      {
        id: 'old',
        type: 'video',
        status: 'done',
        inputParams: { prompt: '历史任务' },
        createdAt: '2026-01-01T00:00:00.000Z',
        assets: [
          {
            id: 'a1',
            type: 'video',
            previewUrl: 'https://example.com/old.mp4',
            mimeType: 'video/mp4',
            metadata: { prompt: '历史任务' },
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    ]);

    render(<GeneratePage />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(api.listActiveTasks).toHaveBeenCalledTimes(1);
    expect(api.listTasks).not.toHaveBeenCalled();
    expect(screen.getByText('生成完成后将在此预览')).toBeInTheDocument();
  });

  it('applies composer draft on mount', () => {
    composerDraftStore.clearDraft();
    setComposerDraft({
      mode: 'promptOnly',
      prompt: '回填提示词',
    });

    render(<GeneratePage />);
    expect(screen.getByDisplayValue('回填提示词')).toBeInTheDocument();
  });

  it('polls active tasks while generation is in progress', async () => {
    vi.useFakeTimers();
    vi.mocked(api.listTasks).mockResolvedValue([
      {
        id: 't1',
        type: 'image',
        status: 'processing',
        inputParams: { prompt: 'test' },
        createdAt: '2026-01-01T00:00:00.000Z',
        assets: [],
      },
    ]);
    vi.mocked(api.listActiveTasks).mockResolvedValue([
      {
        id: 't1',
        type: 'image',
        status: 'processing',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    render(<GeneratePage />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(api.listTasks).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(api.listActiveTasks).toHaveBeenCalledTimes(2);
    expect(api.listTasks).toHaveBeenCalledTimes(1);
  });

  it('refreshes session tasks when active polling completes', async () => {
    vi.useFakeTimers();
    vi.mocked(api.listTasks)
      .mockResolvedValueOnce([
        {
          id: 't1',
          type: 'image',
          status: 'processing',
          inputParams: { prompt: 'test' },
          createdAt: '2026-01-01T00:00:00.000Z',
          assets: [],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 't1',
          type: 'image',
          status: 'done',
          inputParams: { prompt: 'test' },
          createdAt: '2026-01-01T00:00:00.000Z',
          assets: [
            {
              id: 'a1',
              type: 'image',
              ossKey: 'assets/u1/a1.png',
              previewUrl: 'https://example.com/a1.png',
              mimeType: 'image/png',
              metadata: {},
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        },
      ]);
    vi.mocked(api.listActiveTasks)
      .mockResolvedValueOnce([
        {
          id: 't1',
          type: 'image',
          status: 'processing',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ])
      .mockResolvedValue([]);

    render(<GeneratePage />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(api.listTasks).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(api.listActiveTasks).toHaveBeenCalledTimes(2);
    expect(api.listTasks).toHaveBeenCalledTimes(2);
  });
});
