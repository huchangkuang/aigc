import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api-client';
import { useGenerationTaskPoll } from '../use-generation-task-poll';

vi.mock('../api-client', () => ({
  api: {
    listActiveTasks: vi.fn(),
    getGenerationTask: vi.fn(),
  },
}));

describe('useGenerationTaskPoll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('polls while watched tasks are active and calls onSettled when done', async () => {
    vi.useFakeTimers();
    vi.mocked(api.listActiveTasks)
      .mockResolvedValueOnce([
        {
          id: 't1',
          type: 'image',
          status: 'processing',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValue([]);
    vi.mocked(api.getGenerationTask).mockResolvedValue({
      id: 't1',
      type: 'image',
      status: 'done',
      inputParams: {},
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    const onSettled = vi.fn();

    renderHook(() =>
      useGenerationTaskPoll({
        taskIds: ['t1'],
        onSettled,
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(api.listActiveTasks).toHaveBeenCalledTimes(1);
    expect(onSettled).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(api.listActiveTasks).toHaveBeenCalledTimes(2);
    expect(onSettled).toHaveBeenCalledWith([
      expect.objectContaining({ id: 't1', status: 'done' }),
    ]);
  });

  it('does not call onSettled on mount when watched tasks are already settled', async () => {
    vi.mocked(api.listActiveTasks).mockResolvedValue([]);

    const onSettled = vi.fn();

    renderHook(() =>
      useGenerationTaskPoll({
        taskIds: ['t1'],
        onSettled,
      }),
    );

    await waitFor(() => {
      expect(api.listActiveTasks).toHaveBeenCalled();
    });

    expect(onSettled).not.toHaveBeenCalled();
  });
});
