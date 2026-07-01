import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AssetCardMenu } from '../asset-card-menu';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/lib/api-client', () => ({
  api: {
    getComposeContext: vi.fn(),
    renameAsset: vi.fn(),
    deleteAsset: vi.fn(),
  },
}));

vi.mock('@/stores/toast-store', () => ({
  toast: vi.fn(),
}));

import { api } from '@/lib/api-client';
import { setComposerDraft, composerDraftStore } from '@/stores/composer-draft-store';
import { toast } from '@/stores/toast-store';

const asset = {
  id: 'a1',
  type: 'video' as const,
  previewUrl: 'https://example.com/a1.mp4',
  mimeType: 'video/mp4',
  metadata: { prompt: '小猫' },
  createdAt: '2026-06-30T00:00:00.000Z',
};

describe('AssetCardMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    composerDraftStore.clearDraft();
  });

  it('opens menu and navigates for similar generation', async () => {
    vi.mocked(api.getComposeContext).mockResolvedValue({
      assetId: 'a1',
      assetType: 'video',
      prompt: '小猫',
      imageUrls: ['https://example.com/ref.png'],
      generationType: 'video_i2v_first',
      frames: 121,
    });

    render(<AssetCardMenu asset={asset} onChanged={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '更多操作' }));
    fireEvent.click(screen.getByRole('button', { name: '同款生成' }));

    await waitFor(() => {
      expect(api.getComposeContext).toHaveBeenCalledWith('a1');
      expect(push).toHaveBeenCalledWith('/generate');
    });
  });

  it('shows toast when image-only has no references', async () => {
    vi.mocked(api.getComposeContext).mockResolvedValue({
      assetId: 'a1',
      assetType: 'image',
      imageUrls: [],
    });

    render(<AssetCardMenu asset={asset} onChanged={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '更多操作' }));
    fireEvent.click(screen.getByRole('button', { name: '仅用图片' }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith('该资产没有可用的参考图', 'error');
      expect(push).not.toHaveBeenCalled();
    });
  });

  it('shows trash confirmation when deleting', () => {
    render(<AssetCardMenu asset={asset} onChanged={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '更多操作' }));
    fireEvent.click(screen.getByRole('button', { name: '删除' }));

    expect(screen.getByText(/移入回收站/)).toBeInTheDocument();
  });
});
