import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProjectAssetsPage from '../page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'p1' }),
}));

const toast = vi.fn();

vi.mock('@/stores/toast-store', () => ({
  toast: (...args: unknown[]) => toast(...args),
}));

const {
  listEntityImages,
  adoptEntityImage,
  getShortVideoProject,
  generateEntityImage,
  listActiveTasks,
  getGenerationTask,
} = vi.hoisted(() => ({
  listEntityImages: vi.fn(),
  adoptEntityImage: vi.fn(),
  getShortVideoProject: vi.fn(),
  generateEntityImage: vi.fn(),
  listActiveTasks: vi.fn(),
  getGenerationTask: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  api: {
    getShortVideoProject,
    listEntityImages,
    adoptEntityImage,
    uploadEntityImage: vi.fn(),
    uploadReference: vi.fn(),
    generateEntityImage,
    listActiveTasks,
    getGenerationTask,
  },
}));

const entityFixture = {
  id: 'c1',
  kind: 'character' as const,
  name: '角色A',
  description: 'desc',
  imagePrompt: 'prompt',
};

describe('ProjectAssetsPage', () => {
  afterEach(() => {
    vi.useRealTimers();
    toast.mockClear();
  });

  it('shows empty entities hint', async () => {
    getShortVideoProject.mockResolvedValue({
      id: 'p1',
      parsedEntities: { characters: [], scenes: [], props: [] },
    });

    render(<ProjectAssetsPage />);
    expect(await screen.findByText('请先在剧本页解析实体')).toBeInTheDocument();
  });

  it('loads entity history and adopts manually', async () => {
    getShortVideoProject.mockResolvedValue({
      id: 'p1',
      parsedEntities: {
        characters: [entityFixture],
        scenes: [],
        props: [],
      },
    });
    listEntityImages.mockResolvedValue({
      items: [
        {
          id: 'a-new',
          previewUrl: 'https://example.com/new.png',
          createdAt: '2026-01-02',
          adopted: false,
        },
      ],
    });
    listActiveTasks.mockResolvedValue([]);
    adoptEntityImage.mockResolvedValue({ assetId: 'a-new' });

    render(<ProjectAssetsPage />);
    expect(await screen.findByText('角色A')).toBeInTheDocument();
    expect(screen.queryByText('已采用')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /采纳/ }));

    await waitFor(() => {
      expect(adoptEntityImage).toHaveBeenCalledWith('p1', 'c1', 'a-new');
    });
  });

  it('shows adopted badge when entity assetId matches preview', async () => {
    getShortVideoProject.mockResolvedValue({
      id: 'p1',
      parsedEntities: {
        characters: [{ ...entityFixture, id: 'c1', name: '角色B', assetId: 'a1' }],
        scenes: [],
        props: [],
      },
    });
    listEntityImages.mockResolvedValue({
      items: [
        {
          id: 'a1',
          previewUrl: 'https://example.com/1.png',
          createdAt: '2026-01-01',
          adopted: true,
        },
      ],
    });
    listActiveTasks.mockResolvedValue([]);

    render(<ProjectAssetsPage />);
    expect(await screen.findByText('已采用')).toBeInTheDocument();
  });

  it('keeps generating state until image task settles', async () => {
    vi.useFakeTimers();
    getShortVideoProject
      .mockResolvedValueOnce({
        id: 'p1',
        parsedEntities: { characters: [entityFixture], scenes: [], props: [] },
      })
      .mockResolvedValueOnce({
        id: 'p1',
        parsedEntities: {
          characters: [{ ...entityFixture, imageTaskId: 't1' }],
          scenes: [],
          props: [],
        },
      })
      .mockResolvedValue({
        id: 'p1',
        parsedEntities: {
          characters: [{ ...entityFixture, imageTaskId: 't1' }],
          scenes: [],
          props: [],
        },
      });
    listEntityImages.mockResolvedValue({ items: [] });
    listActiveTasks
      .mockResolvedValueOnce([
        {
          id: 't1',
          type: 'image',
          status: 'processing',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ])
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
    getGenerationTask.mockResolvedValue({
      id: 't1',
      type: 'image',
      status: 'done',
      inputParams: {},
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    generateEntityImage.mockResolvedValue({
      id: 't1',
      type: 'image',
      status: 'pending',
      inputParams: {},
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    render(<ProjectAssetsPage />);
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole('button', { name: /生成参考图/ }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole('button', { name: /生成中/ })).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(getGenerationTask).toHaveBeenCalledWith('t1', { silent: true });
  });

  it('resumes polling for imageTaskId on mount', async () => {
    getShortVideoProject.mockResolvedValue({
      id: 'p1',
      parsedEntities: {
        characters: [{ ...entityFixture, imageTaskId: 't1' }],
        scenes: [],
        props: [],
      },
    });
    listEntityImages.mockResolvedValue({ items: [] });
    listActiveTasks.mockResolvedValue([
      {
        id: 't1',
        type: 'image',
        status: 'processing',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    render(<ProjectAssetsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('生成中…').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows toast when image generation fails', async () => {
    vi.useFakeTimers();
    getShortVideoProject.mockResolvedValue({
      id: 'p1',
      parsedEntities: {
        characters: [{ ...entityFixture, imageTaskId: 't1' }],
        scenes: [],
        props: [],
      },
    });
    listEntityImages.mockResolvedValue({ items: [] });
    listActiveTasks
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
    getGenerationTask.mockResolvedValue({
      id: 't1',
      type: 'image',
      status: 'failed',
      errorMessage: 'boom',
      inputParams: {},
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    render(<ProjectAssetsPage />);

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(toast).toHaveBeenCalledWith('生成失败，请重试', 'error');
  });
});
