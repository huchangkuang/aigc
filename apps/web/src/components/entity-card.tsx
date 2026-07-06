'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/icon';
import { EntityImageHistory } from '@/components/entity-image-history';
import { EntityImagePreview } from '@/components/entity-image-preview';
import type { EntityImageItem } from '@/lib/api-client';
import { ENTITY_KIND_LABEL, type ParsedEntity } from '@/lib/short-video-types';

type EntityCardProps = {
  entity: ParsedEntity;
  historyItems: EntityImageItem[];
  busy?: boolean;
  adoptBusy?: boolean;
  uploadBusy?: boolean;
  onGenerate: (prompt: string) => void;
  onAdopt: (assetId: string) => void;
  onUpload: (file: File) => void;
};

export function EntityCard({
  entity,
  historyItems,
  busy,
  adoptBusy,
  uploadBusy,
  onGenerate,
  onAdopt,
  onUpload,
}: EntityCardProps) {
  const [prompt, setPrompt] = useState(entity.imagePrompt);
  const [previewAssetId, setPreviewAssetId] = useState<string | undefined>(
    entity.assetId ?? historyItems[0]?.id,
  );

  useEffect(() => {
    if (previewAssetId && historyItems.some((item) => item.id === previewAssetId)) {
      return;
    }
    setPreviewAssetId(entity.assetId ?? historyItems[0]?.id);
  }, [entity.assetId, historyItems, previewAssetId]);

  const previewItem = historyItems.find((item) => item.id === previewAssetId);
  const adopted = Boolean(previewAssetId && previewAssetId === entity.assetId);

  return (
    <article className="glass-panel overflow-hidden rounded-xl">
      <div className="flex flex-col gap-md p-md lg:flex-row">
        <div className="mx-auto flex shrink-0 flex-col gap-sm lg:mx-0">
          <EntityImagePreview
            previewUrl={previewItem?.previewUrl}
            alt={entity.name}
            adopted={adopted}
            showAdopt={Boolean(previewAssetId && !adopted)}
            adoptBusy={adoptBusy}
            onAdopt={() => previewAssetId && onAdopt(previewAssetId)}
          />
          <EntityImageHistory
            items={historyItems}
            previewAssetId={previewAssetId}
            uploadBusy={uploadBusy}
            onSelect={setPreviewAssetId}
            onUpload={onUpload}
          />
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
              {busy ? '生成中…' : historyItems.length ? '重新生成' : '生成参考图'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
