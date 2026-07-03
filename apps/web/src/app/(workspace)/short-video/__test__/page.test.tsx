import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ShortVideoListPage from '../page';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/lib/api-client', () => ({
  api: {
    listShortVideoProjects: vi.fn().mockResolvedValue([
      {
        id: 'p1',
        title: '测试短剧',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parsedEntities: null,
        segments: null,
      },
    ]),
    createShortVideoProject: vi.fn().mockResolvedValue({ id: 'p2', title: '新短剧' }),
  },
}));

describe('ShortVideoListPage', () => {
  it('renders project list', async () => {
    render(<ShortVideoListPage />);
    expect(await screen.findByText('测试短剧')).toBeInTheDocument();
  });

  it('opens create dialog and creates project', async () => {
    const { api } = await import('@/lib/api-client');
    render(<ShortVideoListPage />);
    await screen.findByText('测试短剧');

    fireEvent.click(screen.getByRole('button', { name: '创建项目' }));
    expect(screen.getByRole('dialog', { name: '新建短视频项目' })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('输入项目名称'), {
      target: { value: '新短剧' },
    });
    fireEvent.click(screen.getByRole('button', { name: '创建' }));

    await waitFor(() => {
      expect(api.createShortVideoProject).toHaveBeenCalledWith('新短剧');
      expect(push).toHaveBeenCalledWith('/short-video/p2/script');
    });
  });
});
