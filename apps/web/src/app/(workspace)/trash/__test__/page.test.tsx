import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TrashPage from '../page';

vi.mock('@/lib/api-client', () => ({
  api: {
    listTrashAssets: vi.fn().mockResolvedValue([]),
  },
}));

describe('TrashPage', () => {
  it('shows empty state', async () => {
    render(<TrashPage />);
    expect(await screen.findByText('回收站是空的')).toBeInTheDocument();
    expect(screen.getByText('返回资产库')).toBeInTheDocument();
  });
});
