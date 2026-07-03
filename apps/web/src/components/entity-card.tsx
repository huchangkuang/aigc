'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';
import { ENTITY_KIND_LABEL, type ParsedEntity } from '@/lib/short-video-types';

type EntityCardProps = {
  entity: ParsedEntity;
  previewUrl?: string;
  busy?: boolean;
  onGenerate: (prompt: string) => void;
};

export function EntityCard({ entity, previewUrl, busy, onGenerate }: EntityCardProps) {
  const [prompt, setPrompt] = useState(entity.imagePrompt);

  return (
    <article className="glass-panel overflow-hidden rounded-xl">
      <div className="flex flex-col gap-md p-md lg:flex-row">
        <div className="relative mx-auto aspect-square w-full max-w-[11rem] shrink-0 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-high lg:mx-0">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={entity.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-on-surface-variant">
              <Icon name="image" className="text-4xl opacity-50" />
              <span className="text-label-sm">暂无参考图</span>
            </div>
          )}
          {entity.assetId ? (
            <span className="absolute right-2 top-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-medium text-on-primary">
              已生成
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-sm">
          <div className="flex flex-wrap items-start justify-between gap-sm">
            <div>
              <span className="text-label-sm font-medium text-primary">
                {ENTITY_KIND_LABEL[entity.kind]}
              </span>
              <h3 className="text-base font-bold text-on-surface">{entity.name}</h3>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-on-surface-variant">{entity.description}</p>

          <div>
            <label
              htmlFor={`entity-prompt-${entity.id}`}
              className="text-label-sm mb-1 block font-medium text-on-surface-variant"
            >
              生图提示词
            </label>
            <textarea
              id={`entity-prompt-${entity.id}`}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-low p-sm text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder="描述参考图的画面内容、风格…"
            />
          </div>

          <div className="flex justify-end pt-xs">
            <button
              type="button"
              disabled={busy || !prompt.trim()}
              onClick={() => onGenerate(prompt.trim())}
              className="gradient-button inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-md py-sm text-sm font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="auto_awesome" className="text-base" />
              {busy ? '生成中…' : entity.assetId ? '重新生成' : '生成参考图'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
