'use client';

import { Icon } from '@/components/icon';
import { AssetCardMenu } from '@/components/asset-card-menu';
import { MediaPreview } from '@/components/media-preview';
import { getAssetDisplayTitle } from '@/lib/asset-display';
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

type AssetCardProps = {
  asset: Asset;
  onChanged: () => void;
};

export function AssetCard({ asset, onChanged }: AssetCardProps) {
  const title = getAssetDisplayTitle(asset);

  return (
    <article className="asset-card glass-panel group flex flex-col overflow-hidden rounded-xl transition-all duration-300">
      <div className="relative aspect-square overflow-hidden bg-surface-container-low">
        {asset.previewUrl ? (
          <MediaPreview
            src={asset.previewUrl}
            type={asset.type}
            title={title}
            className="group block h-full w-full"
            mediaClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
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
              onClick={(event) => event.stopPropagation()}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-surface/80 backdrop-blur-md text-on-surface transition-colors hover:text-primary"
            >
              <Icon name="download" className="text-sm" />
            </a>
            <AssetCardMenu asset={asset} onChanged={onChanged} />
          </div>
        ) : null}

        <div className="pointer-events-none absolute bottom-3 left-3">
          <span
            className={`rounded px-2 py-1 text-[10px] font-bold tracking-wider shadow-sm backdrop-blur-md ${
              asset.type === 'video'
                ? 'bg-black/70 text-white ring-1 ring-secondary/40'
                : 'bg-black/70 text-white ring-1 ring-primary/40'
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
