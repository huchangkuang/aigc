'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/icon';
import { SegmentPromptEditor, type SegmentPromptEditorProps } from '@/components/segment-prompt-editor';
import type { AdoptedEntityImageItem } from '@/lib/api-client';
import {
  DEFAULT_SEEDANCE_RESOLUTION,
  listSeedanceResolutionOptions,
} from '@/lib/seedance-resolutions';
import { listSeedanceDurationOptions } from '@/lib/seedance-duration';
import { SEEDANCE_MODELS, type Segment } from '@/lib/short-video-types';

type SegmentCardProps = {
  segment: Segment;
  index: number;
  mentionItems: AdoptedEntityImageItem[];
  busy?: boolean;
  previewUrl?: string;
  onBlurSave: SegmentPromptEditorProps['onBlurSave'];
  onGenerate: (payload: {
    model: string;
    resolution: string;
    duration: number;
    prompt: string;
    assetIds: string[];
  }) => void;
};

function SegmentParamSelect({
  icon,
  label,
  value,
  onChange,
  children,
}: {
  icon: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-outline-variant/40 bg-surface-container-high/80 px-2 py-1 text-xs text-on-surface transition-colors hover:border-primary/30">
      <Icon
        name={icon}
        className="pointer-events-none shrink-0 text-sm text-on-surface-variant"
        aria-hidden
      />
      <span className="relative inline-flex items-center">
        <select
          value={value}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          className="max-w-[96px] cursor-pointer appearance-none bg-transparent py-0 pl-0 pr-4 outline-none"
        >
          {children}
        </select>
        <Icon
          name="expand_more"
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant"
          aria-hidden
        />
      </span>
    </label>
  );
}

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
  const [resolution, setResolution] = useState(
    segment.resolution ?? DEFAULT_SEEDANCE_RESOLUTION,
  );
  const [duration, setDuration] = useState(segment.durationSec);
  const latestRef = useRef({ prompt: segment.seedancePrompt, assetIds: [] as string[] });

  useEffect(() => {
    const allowed = listSeedanceResolutionOptions(model).map((item) => item.value);
    if (!allowed.includes(resolution)) {
      setResolution(DEFAULT_SEEDANCE_RESOLUTION);
    }
  }, [model, resolution]);

  return (
    <article className="glass-panel overflow-hidden rounded-xl">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="relative flex aspect-video w-full shrink-0 items-center justify-center bg-surface-container-high lg:w-64 xl:w-72">
          {previewUrl ? (
            <video
              src={previewUrl}
              controls
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-on-surface-variant">
              <Icon name="movie" className="text-3xl opacity-40" />
              <span className="text-label-sm">待生成视频</span>
            </div>
          )}
          <span className="absolute left-2.5 top-2.5 rounded-md bg-surface/90 px-1.5 py-0.5 text-xs font-bold text-primary backdrop-blur-sm">
            #{index + 1}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-sm p-md">
          <div className="shrink-0 space-y-1">
            <h3 className="text-sm font-bold text-on-surface">片段 {index + 1}</h3>
            {segment.visualStyle ? (
              <p className="text-label-sm text-on-surface-variant">
                <span className="font-medium text-on-surface">画面风格</span>
                {' · '}
                {segment.visualStyle}
              </p>
            ) : null}
            <p className="line-clamp-2 text-sm leading-relaxed text-on-surface-variant">
              {segment.sceneDescription}
            </p>
          </div>

          <div className="flex min-h-[168px] flex-1 flex-col">
            <SegmentPromptEditor
              segment={segment}
              mentionItems={mentionItems}
              onBlurSave={onBlurSave}
              onStateChange={({ prompt, assetIds }) => {
                latestRef.current = { prompt, assetIds };
              }}
            />
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-t border-outline-variant/20 pt-sm">
            <SegmentParamSelect
              icon="smart_toy"
              label="Seedance 模型"
              value={model}
              onChange={(value) => setModel(value as NonNullable<Segment['model']>)}
            >
              {SEEDANCE_MODELS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </SegmentParamSelect>
            <SegmentParamSelect
              icon="hd"
              label="视频分辨率"
              value={resolution}
              onChange={setResolution}
            >
              {listSeedanceResolutionOptions(model).map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </SegmentParamSelect>
            <SegmentParamSelect
              icon="schedule"
              label="视频时长"
              value={String(duration)}
              onChange={(value) => setDuration(Number(value))}
            >
              {listSeedanceDurationOptions().map((seconds) => (
                <option key={seconds} value={String(seconds)}>
                  {seconds} 秒
                </option>
              ))}
            </SegmentParamSelect>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                onGenerate({
                  model,
                  resolution,
                  duration,
                  prompt: latestRef.current.prompt,
                  assetIds: latestRef.current.assetIds,
                })
              }
              className="gradient-button ml-auto inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-on-primary transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="bolt" className="text-sm" />
              {busy ? '生成中…' : previewUrl ? '重新生成' : 'AI 生成'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
