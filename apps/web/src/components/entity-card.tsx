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
    <article className="glass-panel rounded-xl p-md">
      <div className="mb-sm flex items-center justify-between gap-sm">
        <div>
          <span className="text-label-sm text-primary">{ENTITY_KIND_LABEL[entity.kind]}</span>
          <h3 className="text-sm font-bold text-on-surface">{entity.name}</h3>
        </div>
        {entity.assetId ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            已有参考图
          </span>
        ) : null}
      </div>
      <p className="text-label-sm mb-sm text-on-surface-variant">{entity.description}</p>
      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        rows={3}
        className="mb-sm w-full rounded-lg border border-outline-variant bg-surface-container-low p-sm text-sm text-on-surface outline-none focus:border-primary"
        placeholder="生图提示词"
      />
      <div className="flex items-start gap-md">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-outline-variant/40 bg-surface-container-high">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={entity.name} className="h-full w-full object-cover" />
          ) : (
            <Icon name="image" className="text-3xl text-on-surface-variant" />
          )}
        </div>
        <button
          type="button"
          disabled={busy || !prompt.trim()}
          onClick={() => onGenerate(prompt.trim())}
          className="gradient-button rounded-lg px-md py-sm text-sm font-bold text-on-primary disabled:opacity-50"
        >
          {busy ? '生成中…' : '生成参考图'}
        </button>
      </div>
    </article>
  );
}
