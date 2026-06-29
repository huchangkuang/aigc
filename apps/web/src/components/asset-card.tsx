'use client';

import { Icon } from '@/components/icon';
import type { Asset } from '@/lib/api-client';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function assetTags(asset: Asset): string[] {
  const tags: string[] = [asset.type === 'video' ? '视频' : '图片'];
  const mime = asset.mimeType?.split('/')[1];
  if (mime) tags.push(mime.toUpperCase());
  return tags;
}

export function AssetCard({ asset }: { asset: Asset }) {
  const title = String(asset.metadata.prompt ?? asset.id).slice(0, 40);

  return (
    <article className="asset-card glass-panel group flex flex-col overflow-hidden rounded-xl transition-all duration-300">
      <div className="relative aspect-square overflow-hidden bg-surface-container-low">
        {asset.type === 'image' && asset.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.previewUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : asset.type === 'video' && asset.previewUrl ? (
          <>
            <video src={asset.previewUrl} className="h-full w-full object-cover" muted />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/0">
              <Icon
                name="play_circle"
                className="text-display-lg text-primary/60 transition-colors group-hover:text-primary"
              />
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon name="broken_image" className="text-4xl text-on-surface-variant" />
          </div>
        )}

        {asset.previewUrl ? (
          <div className="absolute right-3 top-3 flex gap-xs opacity-0 transition-opacity group-hover:opacity-100">
            <a
              href={asset.previewUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface/80 backdrop-blur-md text-on-surface transition-colors hover:text-primary"
            >
              <Icon name="download" className="text-sm" />
            </a>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface/80 backdrop-blur-md text-on-surface transition-colors hover:text-primary"
              disabled
            >
              <Icon name="more_vert" className="text-sm" />
            </button>
          </div>
        ) : null}

        <div className="absolute bottom-3 left-3">
          <span
            className={`rounded px-2 py-1 text-[10px] font-bold tracking-wider backdrop-blur-md ${
              asset.type === 'video'
                ? 'bg-secondary/20 text-secondary'
                : 'bg-primary/20 text-primary'
            }`}
          >
            {asset.type === 'video' ? '视频' : '图片'}
          </span>
        </div>
      </div>

      <div className="space-y-xs p-md">
        <h3 className="truncate font-bold text-on-surface">{title}</h3>
        <p className="text-label-sm font-code-md text-on-surface-variant">
          {formatDate(asset.createdAt)}
        </p>
        <div className="mt-sm flex flex-wrap gap-xs">
          {assetTags(asset).map((tag) => (
            <span
              key={tag}
              className="rounded border border-outline-variant/30 bg-surface-container-highest px-2 py-0.5 text-[10px] text-on-surface-variant"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
