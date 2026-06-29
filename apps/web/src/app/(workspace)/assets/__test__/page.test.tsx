import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AssetsPage from '../page';

vi.mock('@/lib/api-client', () => ({
  api: {
    listAssets: vi.fn().mockResolvedValue([]),
  },
}));

describe('AssetsPage', () => {
  it('shows empty state', async () => {
    render(<AssetsPage />);
    expect(await screen.findByText('还没有资产')).toBeInTheDocument();
    expect(screen.getByText('去生成素材')).toBeInTheDocument();
  });
});
