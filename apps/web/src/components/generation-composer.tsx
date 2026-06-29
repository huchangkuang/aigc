'use client';

import { FormEvent, useRef, type ReactNode } from 'react';
import { Icon } from '@/components/icon';
import { MediaPreview } from '@/components/media-preview';

const GENERATION_TYPES = [
  { value: 'image', label: '文生图', icon: 'image' },
  { value: 'video_t2v', label: '文生视频', icon: 'videocam' },
  { value: 'video_i2v_first', label: '图生视频·首帧', icon: 'photo_camera' },
  { value: 'video_i2v_first_tail', label: '图生视频·首尾帧', icon: 'flip' },
  { value: 'video_i2v_recamera', label: '图生视频·运镜', icon: '360' },
] as const;

export type GenerationType = (typeof GENERATION_TYPES)[number]['value'];

export type ReferencePreview = {
  id: string;
  src: string;
  uploading?: boolean;
};

const MAX_REFERENCE_IMAGES = 14;

type GenerationComposerProps = {
  type: GenerationType;
  onTypeChange: (type: GenerationType) => void;
  prompt: string;
  onPromptChange: (value: string) => void;
  references: ReferencePreview[];
  onRemoveReference: (id: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  frames: number;
  onFramesChange: (value: number) => void;
  templateId: string;
  onTemplateIdChange: (value: string) => void;
  cameraStrength: string;
  onCameraStrengthChange: (value: string) => void;
  loading: boolean;
  message: string;
  onUploadFile: (file: File) => void;
  onSubmit: (event: FormEvent) => void;
};

function PillSelect({
  icon,
  value,
  onChange,
  children,
}: {
  icon: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-outline-variant/50 bg-surface-container-high px-3 py-1.5 text-sm transition-colors hover:border-primary/30">
      <Icon name={icon} className="pointer-events-none shrink-0 text-base text-on-surface-variant" />
      <span className="relative inline-flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-[140px] cursor-pointer appearance-none bg-transparent py-0 pl-0 pr-5 text-on-surface outline-none"
        >
          {children}
        </select>
        <Icon
          name="expand_more"
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant"
        />
      </span>
    </label>
  );
}

export function GenerationComposer({
  type,
  onTypeChange,
  prompt,
  onPromptChange,
  references,
  onRemoveReference,
  aspectRatio,
  onAspectRatioChange,
  frames,
  onFramesChange,
  templateId,
  onTemplateIdChange,
  cameraStrength,
  onCameraStrengthChange,
  loading,
  message,
  onUploadFile,
  onSubmit,
}: GenerationComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const needsImages = type.includes('i2v') || type === 'image';
  const selectedType = GENERATION_TYPES.find((item) => item.value === type);
  const uploadingCount = references.filter((item) => item.uploading).length;

  return (
    <form onSubmit={onSubmit} className="glass-panel rounded-xl p-md">
      <div className="mb-sm flex items-center justify-between">
        <label htmlFor="prompt" className="text-label-sm text-on-surface-variant">
          视觉描述 (PROMPT)
        </label>
      </div>
      <textarea
        id="prompt"
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        className="workbench-input text-code-md mb-md min-h-36 w-full resize-none rounded-lg border border-outline-variant/40 bg-surface-container-low p-sm font-mono"
        placeholder="描述你想生成的画面，例如：赛博朋克城市黄昏，生物荧光植物缠绕黑曜石摩天楼，电影级光效…"
        required
      />

      {needsImages ? (
        <div className="mb-md">
          <div className="flex flex-wrap items-start gap-sm">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={references.length >= MAX_REFERENCE_IMAGES || uploadingCount > 0}
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-outline-variant/60 bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
            >
              <Icon name="add" className="text-xl" />
              <span className="mt-1 text-[10px] leading-tight">上传参考图</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadFile(file);
                e.target.value = '';
              }}
            />
            {references.map((item) => (
              <div
                key={item.id}
                className="group relative h-20 w-20 overflow-hidden rounded-lg border border-outline-variant/40 bg-surface-container-low"
              >
                {!item.uploading ? (
                  <MediaPreview
                    src={item.src}
                    type="image"
                    className="h-full w-full"
                    mediaClassName="h-full w-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.src} alt="" className="h-full w-full object-cover" />
                )}
                {item.uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface/70">
                    <Icon name="progress_activity" className="animate-spin text-primary" />
                  </div>
                ) : null}
                {!item.uploading ? (
                  <button
                    type="button"
                    onClick={() => onRemoveReference(item.id)}
                    className="absolute right-0.5 top-0.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-surface/90 text-on-surface opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Icon name="close" className="text-xs" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-xs flex items-center justify-between">
            <p className="text-[11px] text-on-surface-variant">支持 JPG、PNG、WEBP，最大 10MB</p>
            <span className="text-[11px] text-on-surface-variant">
              {references.filter((item) => !item.uploading).length} / {MAX_REFERENCE_IMAGES}
            </span>
          </div>
        </div>
      ) : null}

      <div className="mb-md flex flex-wrap gap-sm border-t border-outline-variant/20 pt-md">
        <PillSelect
          icon={selectedType?.icon ?? 'auto_awesome'}
          value={type}
          onChange={(v) => onTypeChange(v as GenerationType)}
        >
          {GENERATION_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </PillSelect>

        {type === 'video_t2v' && (
          <PillSelect icon="crop_free" value={aspectRatio} onChange={onAspectRatioChange}>
            {['16:9', '4:3', '1:1', '3:4', '9:16', '21:9'].map((ratio) => (
              <option key={ratio} value={ratio}>
                {ratio}
              </option>
            ))}
          </PillSelect>
        )}

        {type.startsWith('video_') && (
          <PillSelect
            icon="schedule"
            value={String(frames)}
            onChange={(v) => onFramesChange(Number(v))}
          >
            <option value="121">5 秒</option>
            <option value="241">10 秒</option>
          </PillSelect>
        )}

        {type === 'video_i2v_recamera' && (
          <>
            <PillSelect icon="video_camera_front" value={templateId} onChange={onTemplateIdChange}>
              <option value="hitchcock_dolly_in">希区柯克推进</option>
              <option value="robo_arm">机械臂</option>
              <option value="handheld">手持运镜</option>
            </PillSelect>
            <PillSelect icon="speed" value={cameraStrength} onChange={onCameraStrengthChange}>
              <option value="weak">运镜·弱</option>
              <option value="medium">运镜·中</option>
              <option value="strong">运镜·强</option>
            </PillSelect>
          </>
        )}
      </div>

      {message ? (
        <p
          className={`mb-md text-sm ${message.includes('失败') || message.includes('Invalid') ? 'text-error' : 'text-primary-fixed-dim'}`}
        >
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || uploadingCount > 0}
        className="gradient-button flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon name="auto_awesome" className={loading ? 'animate-spin' : ''} />
        {loading ? '提交中…' : '开始生成'}
      </button>
    </form>
  );
}
