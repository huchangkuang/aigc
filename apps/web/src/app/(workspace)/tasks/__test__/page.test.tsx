import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TasksPage from '../page';

vi.mock('@/lib/api-client', () => ({
  api: {
    listTasks: vi.fn().mockResolvedValue([]),
  },
}));

describe('TasksPage', () => {
  it('shows empty task center', async () => {
    render(<TasksPage />);
    expect(screen.getByRole('heading', { name: '任务中心' })).toBeInTheDocument();
    expect(await screen.findByText('暂无任务记录')).toBeInTheDocument();
  });
});
