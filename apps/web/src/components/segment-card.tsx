'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';
import { SEEDANCE_MODELS, type Segment } from '@/lib/short-video-types';

type SegmentCardProps = {
  segment: Segment;
  index: number;
  missingRefs?: boolean;
  busy?: boolean;
  previewUrl?: string;
  onGenerate: (model: string) => void;
};

export function SegmentCard({
  segment,
  index,
  missingRefs,
  busy,
  previewUrl,
  onGenerate,
}: SegmentCardProps) {
  const [model, setModel] = useState<NonNullable<Segment['model']>>(
    segment.model ?? '2.0',
  );

  return (
    <article className="glass-panel rounded-xl p-md">
      <div className="mb-sm flex items-center justify-between">
        <h3 className="text-sm font-bold text-on-surface">
          片段 {index + 1}
          <span className="ml-2 text-xs font-normal text-on-surface-variant">
            {segment.durationSec}s
          </span>
        </h3>
        {missingRefs ? (
          <span className="text-xs text-amber-600">部分参考图缺失</span>
        ) : null}
      </div>
      {segment.visualStyle ? (
        <p className="text-label-sm mb-1 text-on-surface-variant">
          画面风格：{segment.visualStyle}
        </p>
      ) : null}
      <p className="text-sm mb-sm text-on-surface">{segment.sceneDescription}</p>
      <textarea
        readOnly
        value={segment.seedancePrompt}
        rows={3}
        className="mb-sm w-full rounded-lg border border-outline-variant/50 bg-surface-container-low/50 p-sm text-xs text-on-surface-variant"
      />
      <div className="flex flex-wrap items-center gap-sm">
        <select
          value={model}
          onChange={(event) =>
            setModel(event.target.value as NonNullable<Segment['model']>)
          }
          className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-1.5 text-sm"
        >
          {SEEDANCE_MODELS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy}
          onClick={() => onGenerate(model)}
          className="gradient-button inline-flex items-center gap-1 rounded-lg px-md py-sm text-sm font-bold text-on-primary disabled:opacity-50"
        >
          <Icon name="bolt" className="text-base" />
          {busy ? '生成中…' : 'AI 生成'}
        </button>
        {previewUrl ? (
          <video src={previewUrl} controls className="ml-auto h-20 w-36 rounded-lg object-cover" />
        ) : null}
      </div>
    </article>
  );
}
