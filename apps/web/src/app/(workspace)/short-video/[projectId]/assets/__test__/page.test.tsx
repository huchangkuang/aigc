import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProjectAssetsPage from '../page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'p1' }),
}));

const {
  listEntityImages,
  adoptEntityImage,
  getShortVideoProject,
  generateEntityImage,
} = vi.hoisted(() => ({
  listEntityImages: vi.fn(),
  adoptEntityImage: vi.fn(),
  getShortVideoProject: vi.fn(),
  generateEntityImage: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  api: {
    getShortVideoProject,
    listEntityImages,
    adoptEntityImage,
    uploadEntityImage: vi.fn(),
    uploadReference: vi.fn(),
    generateEntityImage,
  },
}));

describe('ProjectAssetsPage', () => {
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
        characters: [
          {
            id: 'c1',
            kind: 'character',
            name: '角色A',
            description: 'desc',
            imagePrompt: 'prompt',
          },
        ],
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
        characters: [
          {
            id: 'c1',
            kind: 'character',
            name: '角色B',
            description: 'desc',
            imagePrompt: 'prompt',
            assetId: 'a1',
          },
        ],
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

    render(<ProjectAssetsPage />);
    expect(await screen.findByText('已采用')).toBeInTheDocument();
  });
});
