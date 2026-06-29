'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AssetCard } from '@/components/asset-card';
import { Icon } from '@/components/icon';
import { api, type Asset } from '@/lib/api-client';

const filters = [
  { value: 'all', label: '全部' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
] as const;

type FilterType = (typeof filters)[number]['value'];

export default function AssetsPage() {
  const [type, setType] = useState<FilterType>('all');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listAssets(type === 'all' ? undefined : type)
      .then(setAssets)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'));
  }, [type]);

  return (
    <div className="pb-xl">
      {/* Header & Filters */}
      <section className="flex flex-col justify-between gap-md py-lg md:flex-row md:items-end">
        <div>
          <h2 className="text-headline-lg text-primary">资产画廊</h2>
          <p className="text-body-md mt-1 text-on-surface-variant">
            浏览与管理 AI 生成的图片与视频素材
          </p>
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
      </section>

      {error ? (
        <p className="mb-md rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      {!assets.length && !error ? (
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
      ) : (
        <div className="grid grid-cols-1 gap-md pb-xl sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}
