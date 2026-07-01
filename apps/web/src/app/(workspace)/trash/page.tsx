'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AssetCard } from '@/components/asset-card';
import { Icon } from '@/components/icon';
import { getAssetDisplayTitle } from '@/lib/asset-display';
import { api, type Asset } from '@/lib/api-client';

const filters = [
  { value: 'all', label: '全部' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
] as const;

type FilterType = (typeof filters)[number]['value'];

export default function TrashPage() {
  const [type, setType] = useState<FilterType>('all');
  const [query, setQuery] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);

  const keyword = query.trim().toLowerCase();
  const visibleAssets = keyword
    ? assets.filter((asset) => {
        const title = getAssetDisplayTitle(asset).toLowerCase();
        const prompt =
          typeof asset.metadata.prompt === 'string'
            ? asset.metadata.prompt.toLowerCase()
            : '';
        return title.includes(keyword) || prompt.includes(keyword);
      })
    : assets;

  function loadAssets() {
    api.listTrashAssets(type === 'all' ? undefined : type).then(setAssets);
  }

  useEffect(() => {
    loadAssets();
  }, [type]);

  return (
    <div className="space-y-gutter">
      <section className="flex flex-col justify-between gap-md md:flex-row md:items-end">
        <div>
          <h2 className="text-headline-lg text-primary">回收站</h2>
          <p className="text-body-md mt-1 text-on-surface-variant">
            已删除的资产可恢复或永久销毁
          </p>
        </div>

        <div className="flex flex-col gap-sm sm:flex-row sm:items-center">
          <div className="group relative w-full sm:w-56">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索资产…"
              className="w-full rounded-full border border-outline-variant bg-surface-container-low py-1.5 pl-10 pr-4 text-sm text-on-surface outline-none transition-all placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-xs rounded-lg border border-primary/10 bg-surface-container-high p-1">
            {filters.map((filter) => {
              const active = type === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setType(filter.value)}
                  className={`rounded-md px-md py-1.5 text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary text-on-primary shadow-lg'
                      : 'text-on-surface-variant hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {!assets.length ? (
        <div className="glass-panel flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/20 p-xl text-center">
          <Icon name="delete" className="mb-md text-5xl text-on-surface-variant" />
          <p className="text-body-md text-on-surface-variant">回收站是空的</p>
          <p className="text-label-sm mt-xs text-on-surface-variant">
            从资产库删除的素材会出现在这里
          </p>
          <Link
            href="/assets"
            className="gradient-button mt-md inline-flex items-center gap-sm rounded-lg px-md py-sm text-sm font-bold text-on-primary"
          >
            <Icon name="collections" className="text-base" />
            返回资产库
          </Link>
        </div>
      ) : visibleAssets.length ? (
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              variant="trash"
              onChanged={loadAssets}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel flex flex-col items-center justify-center rounded-xl border border-outline-variant/30 p-xl text-center">
          <Icon name="search" className="mb-md text-5xl text-on-surface-variant" />
          <p className="text-body-md text-on-surface-variant">没有匹配的资产</p>
          <p className="text-label-sm mt-xs text-on-surface-variant">试试其他关键词</p>
        </div>
      )}
    </div>
  );
}
