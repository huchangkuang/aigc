'use client';

import { useState } from 'react';
import { Icon } from '@/components/icon';
import { SEEDANCE_MODELS, type Segment } from '@/lib/short-video-types';

type SegmentCardProps = {
  segment: Segment;
  index: number;
  missingRefs?: boolean;
  busy?: boolean;
  generating?: boolean;
  previewUrl?: string;
  onGenerate: (model: string) => void;
};

export function SegmentCard({
  segment,
  index,
  missingRefs,
  busy,
  generating,
  previewUrl,
  onGenerate,
}: SegmentCardProps) {
  const isGenerating = Boolean(busy || generating);
  const [model, setModel] = useState<NonNullable<Segment['model']>>(
    segment.model ?? '2.0',
  );

  return (
    <article className="glass-panel overflow-hidden rounded-xl">
      <div className="flex flex-col lg:flex-row">
        <div className="relative flex aspect-video w-full shrink-0 items-center justify-center bg-surface-container-high lg:w-72 xl:w-80">
          {previewUrl ? (
            <video
              src={previewUrl}
              controls
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-on-surface-variant">
              <Icon name="movie" className="text-4xl opacity-40" />
              <span className="text-label-sm">待生成视频</span>
            </div>
          )}
          {isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/80 backdrop-blur-sm">
              <Icon name="progress_activity" className="animate-spin text-3xl text-primary" />
              <span className="text-label-sm font-medium text-on-surface">生成中…</span>
            </div>
          ) : null}
          <span className="absolute left-3 top-3 rounded-md bg-surface/90 px-2 py-0.5 text-xs font-bold text-primary backdrop-blur-sm">
            #{index + 1}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-sm p-md">
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <h3 className="text-base font-bold text-on-surface">
              片段 {index + 1}
              <span className="ml-2 text-sm font-normal text-on-surface-variant">
                {segment.durationSec}s
              </span>
            </h3>
            {missingRefs ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                <Icon name="warning" className="text-sm" />
                部分参考图缺失
              </span>
            ) : null}
          </div>

          {segment.visualStyle ? (
            <p className="text-label-sm text-on-surface-variant">
              <span className="font-medium text-on-surface">画面风格</span>
              {' · '}
              {segment.visualStyle}
            </p>
          ) : null}

          <p className="text-sm leading-relaxed text-on-surface">{segment.sceneDescription}</p>

          <div>
            <label
              htmlFor={`segment-prompt-${segment.id}`}
              className="text-label-sm mb-1 block font-medium text-on-surface-variant"
            >
              Seedance 提示词
            </label>
            <textarea
              id={`segment-prompt-${segment.id}`}
              readOnly
              value={segment.seedancePrompt}
              rows={3}
              className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-low/60 p-sm text-sm leading-relaxed text-on-surface-variant"
            />
          </div>

          <div className="flex flex-wrap items-center gap-sm border-t border-outline-variant/20 pt-sm">
            <select
              value={model}
              onChange={(event) =>
                setModel(event.target.value as NonNullable<Segment['model']>)
              }
              aria-label="Seedance 模型"
              className="min-h-11 cursor-pointer rounded-lg border border-outline-variant bg-surface-container-low px-sm py-2 text-sm text-on-surface outline-none focus:border-primary"
            >
              {SEEDANCE_MODELS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => onGenerate(model)}
              className="gradient-button inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-md py-sm text-sm font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon
                name={isGenerating ? 'progress_activity' : 'bolt'}
                className={`text-base ${isGenerating ? 'animate-spin' : ''}`}
              />
              {isGenerating ? '生成中…' : previewUrl ? '重新生成' : 'AI 生成'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
