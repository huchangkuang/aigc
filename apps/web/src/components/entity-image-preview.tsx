'use client';

import { Icon } from '@/components/icon';

type EntityImagePreviewProps = {
  previewUrl?: string;
  alt: string;
  adopted: boolean;
  showAdopt: boolean;
  adoptBusy?: boolean;
  generating?: boolean;
  onAdopt: () => void;
};

export function EntityImagePreview({
  previewUrl,
  alt,
  adopted,
  showAdopt,
  adoptBusy,
  generating,
  onAdopt,
}: EntityImagePreviewProps) {
  return (
    <div className="relative aspect-square w-full max-w-[11rem] overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-high">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-on-surface-variant">
          <Icon name="image" className="text-4xl opacity-50" />
          <span className="text-label-sm">暂无参考图</span>
        </div>
      )}
      {generating ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/80 backdrop-blur-sm">
          <Icon name="progress_activity" className="animate-spin text-3xl text-primary" />
          <span className="text-label-sm font-medium text-on-surface">生成中…</span>
        </div>
      ) : null}
      {adopted ? (
        <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-medium text-white">
          <Icon name="check" className="text-xs" />
          已采用
        </span>
      ) : null}
      {showAdopt && previewUrl ? (
        <button
          type="button"
          disabled={adoptBusy}
          onClick={onAdopt}
          className="absolute bottom-2 right-2 inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-lg bg-primary/90 px-2 py-1 text-[11px] font-medium text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="check_circle" className="text-sm" />
          {adoptBusy ? '采纳中…' : '采纳'}
        </button>
      ) : null}
    </div>
  );
}
