import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProjectAssetsPage from '../page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'p1' }),
}));

vi.mock('@/lib/api-client', () => ({
  api: {
    getShortVideoProject: vi.fn().mockResolvedValue({
      id: 'p1',
      parsedEntities: { characters: [], scenes: [], props: [] },
    }),
    listAssets: vi.fn().mockResolvedValue([]),
    generateEntityImage: vi.fn(),
  },
}));

describe('ProjectAssetsPage', () => {
  it('shows empty entities hint', async () => {
    render(<ProjectAssetsPage />);
    expect(await screen.findByText('请先在剧本页解析实体')).toBeInTheDocument();
  });
});
