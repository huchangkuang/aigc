import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EditPage from '../page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'p1' }),
}));

vi.mock('@/lib/api-client', () => ({
  api: {
    getShortVideoProject: vi.fn().mockResolvedValue({
      id: 'p1',
      parsedEntities: null,
      segments: null,
    }),
    listAssets: vi.fn().mockResolvedValue([]),
    parseShortVideoSegments: vi.fn(),
    generateSegmentVideo: vi.fn(),
  },
}));

describe('EditPage', () => {
  it('shows parse segments hint', async () => {
    render(<EditPage />);
    expect(await screen.findByText('视频编辑')).toBeInTheDocument();
    expect(screen.getByText('点击「解析分镜」生成分镜片段')).toBeInTheDocument();
  });
});
