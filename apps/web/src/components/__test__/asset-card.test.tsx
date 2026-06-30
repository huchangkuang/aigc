import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AssetCard } from '../asset-card';

vi.mock('@/components/asset-card-menu', () => ({
  AssetCardMenu: () => <div data-testid="asset-card-menu" />,
}));

vi.mock('@/components/media-preview', () => ({
  MediaPreview: ({ title }: { title?: string }) => <div>{title}</div>,
}));

describe('AssetCard', () => {
  it('prefers metadata title over prompt', () => {
    render(
      <AssetCard
        asset={{
          id: 'a1',
          type: 'image',
          previewUrl: 'https://example.com/a1.png',
          mimeType: 'image/png',
          metadata: { title: '自定义标题', prompt: '原始提示词' },
          createdAt: '2026-06-30T00:00:00.000Z',
        }}
        onChanged={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: '自定义标题' })).toBeInTheDocument();
  });
});
