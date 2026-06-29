'use client';

import { Icon } from '@/components/icon';
import type { Asset } from '@/lib/api-client';

type GenerationHistoryGridProps = {
  assets: Asset[];
};

export function GenerationHistoryGrid({ assets }: GenerationHistoryGridProps) {
  const recent = assets.slice(0, 3);

  return (
    <div className="grid grid-cols-4 gap-sm">
      {recent.map((asset) => (
        <a
          key={asset.id}
          href={asset.previewUrl}
          target="_blank"
          rel="noreferrer"
          className="glass-panel aspect-square overflow-hidden rounded-lg border border-outline-variant/30 transition-all hover:border-primary/40"
        >
          {asset.previewUrl ? (
            asset.type === 'video' ? (
              <video
                src={asset.previewUrl}
                className="h-full w-full object-cover opacity-60 transition-opacity hover:opacity-100"
                muted
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={asset.previewUrl}
                alt=""
                className="h-full w-full object-cover opacity-60 transition-opacity hover:opacity-100"
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center">
              <Icon name="broken_image" className="text-on-surface-variant" />
            </div>
          )}
        </a>
      ))}
      {Array.from({ length: Math.max(0, 3 - recent.length) }).map((_, index) => (
        <div
          key={`empty-${index}`}
          className="glass-panel flex aspect-square items-center justify-center rounded-lg border border-dashed border-outline-variant/50"
        >
          <Icon name="add" className="text-on-surface-variant" />
        </div>
      ))}
      <div className="glass-panel flex aspect-square items-center justify-center rounded-lg border border-dashed border-outline-variant/50 transition-colors hover:bg-surface-container">
        <Icon name="collections" className="text-on-surface-variant" />
      </div>
    </div>
  );
}
