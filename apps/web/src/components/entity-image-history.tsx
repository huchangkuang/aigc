'use client';

import { useRef } from 'react';
import { Icon } from '@/components/icon';
import type { EntityImageItem } from '@/lib/api-client';

type EntityImageHistoryProps = {
  items: EntityImageItem[];
  previewAssetId?: string;
  uploadBusy?: boolean;
  onSelect: (assetId: string) => void;
  onUpload: (file: File) => void;
};

export function EntityImageHistory({
  items,
  previewAssetId,
  uploadBusy,
  onSelect,
  onUpload,
}: EntityImageHistoryProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full max-w-[11rem] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
          <span>历史记录</span>
          <span>
            {items.length}/{items.length}
          </span>
        </div>
        <button
          type="button"
          disabled={uploadBusy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex cursor-pointer items-center gap-0.5 rounded-md border border-emerald-600/50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="upload" className="text-xs" />
          {uploadBusy ? '上传中…' : '本地上传'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) onUpload(file);
          }}
        />
      </div>
      {items.length ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((item) => {
            const selected = item.id === previewAssetId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${
                  selected ? 'border-emerald-600' : 'border-transparent'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                {item.adopted ? (
                  <span className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-sm bg-emerald-600 text-white">
                    <Icon name="check" className="text-[10px]" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-on-surface-variant">生成或上传后出现在此处</p>
      )}
    </div>
  );
}
