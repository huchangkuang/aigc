import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EditPage from '../page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'p1' }),
}));

const toast = vi.fn();

vi.mock('@/stores/toast-store', () => ({
  toast: (...args: unknown[]) => toast(...args),
}));

const {
  getShortVideoProject,
  listAssets,
  parseShortVideoSegments,
  generateSegmentVideo,
  listActiveTasks,
  getGenerationTask,
} = vi.hoisted(() => ({
  getShortVideoProject: vi.fn(),
  listAssets: vi.fn(),
  parseShortVideoSegments: vi.fn(),
  generateSegmentVideo: vi.fn(),
  listActiveTasks: vi.fn(),
  getGenerationTask: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  api: {
    getShortVideoProject,
    listAssets,
    parseShortVideoSegments,
    generateSegmentVideo,
    listActiveTasks,
    getGenerationTask,
  },
}));

describe('EditPage', () => {
  afterEach(() => {
    vi.useRealTimers();
    toast.mockClear();
  });

  it('shows parse segments hint', async () => {
    getShortVideoProject.mockResolvedValue({
      id: 'p1',
      parsedEntities: null,
      segments: null,
    });
    listAssets.mockResolvedValue([]);
    listActiveTasks.mockResolvedValue([]);

    render(<EditPage />);
    expect(await screen.findByText('视频编辑')).toBeInTheDocument();
    expect(screen.getByText('点击「解析分镜」生成分镜片段')).toBeInTheDocument();
  });

  it('shows immediate loading when parsing segments', async () => {
    getShortVideoProject.mockResolvedValue({
      id: 'p1',
      parsedEntities: null,
      segments: null,
    });
    listAssets.mockResolvedValue([]);
    listActiveTasks.mockResolvedValue([]);
    parseShortVideoSegments.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(undefined), 50);
        }),
    );

    render(<EditPage />);
    await screen.findByText('视频编辑');

    fireEvent.click(screen.getByRole('button', { name: /解析分镜/ }));

    expect(screen.getByRole('button', { name: /解析中/ })).toBeDisabled();
  });

  it('keeps generating state until video task settles', async () => {
    vi.useFakeTimers();
    getShortVideoProject
      .mockResolvedValueOnce({
        id: 'p1',
        parsedEntities: null,
        segments: {
          segments: [
            {
              id: 's1',
              order: 1,
              durationSec: 8,
              sceneDescription: 'desc',
              characterRefIds: [],
              propRefIds: [],
              seedancePrompt: 'prompt',
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        id: 'p1',
        parsedEntities: null,
        segments: {
          segments: [
            {
              id: 's1',
              order: 1,
              durationSec: 8,
              sceneDescription: 'desc',
              characterRefIds: [],
              propRefIds: [],
              seedancePrompt: 'prompt',
              videoTaskId: 't1',
            },
          ],
        },
      })
      .mockResolvedValue({
        id: 'p1',
        parsedEntities: null,
        segments: {
          segments: [
            {
              id: 's1',
              order: 1,
              durationSec: 8,
              sceneDescription: 'desc',
              characterRefIds: [],
              propRefIds: [],
              seedancePrompt: 'prompt',
              videoTaskId: 't1',
            },
          ],
        },
      });
    listAssets.mockResolvedValue([]);
    listActiveTasks
      .mockResolvedValueOnce([
        {
          id: 't1',
          type: 'video_seedance_r2v',
          status: 'processing',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 't1',
          type: 'video_seedance_r2v',
          status: 'processing',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValue([]);
    getGenerationTask.mockResolvedValue({
      id: 't1',
      type: 'video_seedance_r2v',
      status: 'done',
      inputParams: {},
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    generateSegmentVideo.mockResolvedValue({
      id: 't1',
      type: 'video_seedance_r2v',
      status: 'pending',
      inputParams: {},
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    render(<EditPage />);
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole('button', { name: /AI 生成/ }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole('button', { name: /生成中/ })).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(getGenerationTask).toHaveBeenCalledWith('t1', { silent: true });
  });

  it('resumes polling for videoTaskId on mount', async () => {
    getShortVideoProject.mockResolvedValue({
      id: 'p1',
      parsedEntities: null,
      segments: {
        segments: [
          {
            id: 's1',
            order: 1,
            durationSec: 8,
            sceneDescription: 'desc',
            characterRefIds: [],
            propRefIds: [],
            seedancePrompt: 'prompt',
            videoTaskId: 't1',
          },
        ],
      },
    });
    listAssets.mockResolvedValue([]);
    listActiveTasks.mockResolvedValue([
      {
        id: 't1',
        type: 'video_seedance_r2v',
        status: 'processing',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    render(<EditPage />);

    await waitFor(() => {
      expect(screen.getAllByText('生成中…').length).toBeGreaterThanOrEqual(1);
    });
  });
});
