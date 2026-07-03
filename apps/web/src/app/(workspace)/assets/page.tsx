'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AssetCard } from '@/components/asset-card';
import { Icon } from '@/components/icon';
import { getAssetDisplayTitle } from '@/lib/asset-display';
import { api, type Asset } from '@/lib/api-client';

const sourceFilters = [
  { value: 'all', label: '全部' },
  { value: 'material', label: '素材' },
  { value: 'short_video', label: '短视频' },
] as const;

const formatFilters = [
  { value: 'all', label: '全部' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
] as const;

type SourceFilter = (typeof sourceFilters)[number]['value'];
type FormatFilter = (typeof formatFilters)[number]['value'];

export default function AssetsPage() {
  const [source, setSource] = useState<SourceFilter>('all');
  const [type, setType] = useState<FormatFilter>('all');
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
    api
      .listAssets(
        type === 'all' ? undefined : type,
        source === 'all' ? undefined : source,
      )
      .then(setAssets);
  }

  useEffect(() => {
    loadAssets();
  }, [type, source]);

  return (
    <div className="space-y-gutter">
      <section className="flex flex-col justify-between gap-md md:flex-row md:items-end">
        <div>
          <h2 className="text-headline-lg text-primary">资产画廊</h2>
          <p className="text-body-md mt-1 text-on-surface-variant">
            浏览与管理 AI 生成的图片与视频素材
          </p>
        </div>

        <div className="flex flex-col gap-md sm:flex-row sm:items-end">
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

          <div className="flex flex-wrap items-center gap-md rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-md py-sm">
            <div className="flex items-center gap-sm">
              <span className="text-label-sm shrink-0 font-medium text-on-surface-variant">
                来源
              </span>
              <div className="flex items-center gap-0.5 rounded-lg bg-surface-container-high p-0.5">
                {sourceFilters.map((filter) => {
                  const active = source === filter.value;
                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setSource(filter.value)}
                      className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                        active
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="hidden h-6 w-px bg-outline-variant/40 sm:block"
              aria-hidden
            />

            <div className="flex items-center gap-sm">
              <span className="text-label-sm shrink-0 font-medium text-on-surface-variant">
                格式
              </span>
              <div className="flex items-center gap-1">
                {formatFilters.map((filter) => {
                  const active = type === filter.value;
                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setType(filter.value)}
                      className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                        active
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-transparent text-on-surface-variant hover:border-outline-variant/50 hover:text-on-surface'
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {!assets.length ? (
        <div className="glass-panel flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/20 p-xl text-center">
          <Icon name="collections" className="mb-md text-5xl text-on-surface-variant" />
          <p className="text-body-md text-on-surface-variant">还没有资产</p>
          <p className="text-label-sm mt-xs text-on-surface-variant">
            在创作中心生成素材后，将自动出现在这里
          </p>
          <Link
            href="/generate"
            className="gradient-button mt-md inline-flex items-center gap-sm rounded-lg px-md py-sm text-sm font-bold text-on-primary"
          >
            <Icon name="auto_awesome" className="text-base" />
            去生成素材
          </Link>
        </div>
      ) : visibleAssets.length ? (
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleAssets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} onChanged={loadAssets} />
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
