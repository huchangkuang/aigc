import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TrashAssetCardMenu } from '../trash-asset-card-menu';

vi.mock('@/lib/api-client', () => ({
  api: {
    restoreAsset: vi.fn(),
    destroyAsset: vi.fn(),
  },
}));

vi.mock('@/stores/toast-store', () => ({
  toast: vi.fn(),
}));

import { api } from '@/lib/api-client';
import { toast } from '@/stores/toast-store';

const asset = {
  id: 'a1',
  type: 'image' as const,
  previewUrl: 'https://example.com/a1.png',
  mimeType: 'image/png',
  metadata: { prompt: '小猫' },
  createdAt: '2026-06-30T00:00:00.000Z',
  deletedAt: '2026-07-01T00:00:00.000Z',
};

describe('TrashAssetCardMenu', () => {
  const onChanged = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restores asset from menu', async () => {
    vi.mocked(api.restoreAsset).mockResolvedValue(asset);

    render(<TrashAssetCardMenu asset={asset} onChanged={onChanged} />);

    fireEvent.click(screen.getByRole('button', { name: '更多操作' }));
    fireEvent.click(screen.getByRole('button', { name: '恢复' }));

    await waitFor(() => {
      expect(api.restoreAsset).toHaveBeenCalledWith('a1');
      expect(toast).toHaveBeenCalledWith('资产已恢复', 'success');
      expect(onChanged).toHaveBeenCalled();
    });
  });

  it('destroys asset after confirmation', async () => {
    vi.mocked(api.destroyAsset).mockResolvedValue({ id: 'a1' });

    render(<TrashAssetCardMenu asset={asset} onChanged={onChanged} />);

    fireEvent.click(screen.getByRole('button', { name: '更多操作' }));
    fireEvent.click(screen.getByRole('button', { name: '永久销毁' }));
    fireEvent.click(screen.getByRole('button', { name: '永久销毁' }));

    await waitFor(() => {
      expect(api.destroyAsset).toHaveBeenCalledWith('a1');
      expect(toast).toHaveBeenCalledWith('资产已永久销毁', 'success');
      expect(onChanged).toHaveBeenCalled();
    });
  });
});
