'use client';

import { Icon } from '@/components/icon';
import { MediaPreview } from '@/components/media-preview';
import type { Asset } from '@/lib/api-client';

type GenerationHistoryGridProps = {
  assets: Asset[];
};

export function GenerationHistoryGrid({ assets }: GenerationHistoryGridProps) {
  const recent = assets.slice(0, 3);

  return (
    <div className="grid grid-cols-4 gap-sm">
      {recent.map((asset) => {
        const title =
          typeof asset.metadata.prompt === 'string' ? asset.metadata.prompt : undefined;

        return asset.previewUrl ? (
          <MediaPreview
            key={asset.id}
            src={asset.previewUrl}
            type={asset.type}
            title={title}
            className="glass-panel aspect-square overflow-hidden rounded-lg border border-outline-variant/30 transition-all hover:border-primary/40"
            mediaClassName="h-full w-full object-cover opacity-60 transition-opacity hover:opacity-100"
          />
        ) : (
          <div
            key={asset.id}
            className="glass-panel flex aspect-square items-center justify-center rounded-lg border border-outline-variant/30"
          >
            <Icon name="broken_image" className="text-on-surface-variant" />
          </div>
        );
      })}
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
