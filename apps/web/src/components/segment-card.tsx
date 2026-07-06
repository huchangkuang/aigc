'use client';

import { useRef, useState } from 'react';
import { Icon } from '@/components/icon';
import { SegmentPromptEditor, type SegmentPromptEditorProps } from '@/components/segment-prompt-editor';
import type { AdoptedEntityImageItem } from '@/lib/api-client';
import { SEEDANCE_MODELS, type Segment } from '@/lib/short-video-types';

type SegmentCardProps = {
  segment: Segment;
  index: number;
  mentionItems: AdoptedEntityImageItem[];
  busy?: boolean;
  previewUrl?: string;
  onBlurSave: SegmentPromptEditorProps['onBlurSave'];
  onGenerate: (payload: { model: string; prompt: string; assetIds: string[] }) => void;
};

export function SegmentCard({
  segment,
  index,
  mentionItems,
  busy,
  previewUrl,
  onBlurSave,
  onGenerate,
}: SegmentCardProps) {
  const [model, setModel] = useState<NonNullable<Segment['model']>>(
    segment.model ?? '2.0',
  );
  const latestRef = useRef({ prompt: segment.seedancePrompt, assetIds: [] as string[] });

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
          </div>

          {segment.visualStyle ? (
            <p className="text-label-sm text-on-surface-variant">
              <span className="font-medium text-on-surface">画面风格</span>
              {' · '}
              {segment.visualStyle}
            </p>
          ) : null}

          <p className="text-sm leading-relaxed text-on-surface">{segment.sceneDescription}</p>

          <SegmentPromptEditor
            segment={segment}
            mentionItems={mentionItems}
            onBlurSave={onBlurSave}
            onStateChange={({ prompt, assetIds }) => {
              latestRef.current = { prompt, assetIds };
            }}
          />

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
              disabled={busy}
              onClick={() =>
                onGenerate({
                  model,
                  prompt: latestRef.current.prompt,
                  assetIds: latestRef.current.assetIds,
                })
              }
              className="gradient-button inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-md py-sm text-sm font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="bolt" className="text-base" />
              {busy ? '生成中…' : previewUrl ? '重新生成' : 'AI 生成'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
