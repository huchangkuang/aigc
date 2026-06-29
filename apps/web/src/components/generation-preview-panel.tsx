'use client';

import { Icon } from '@/components/icon';
import { MediaPreview } from '@/components/media-preview';
import type { Asset, GenerationTask } from '@/lib/api-client';

type GenerationPreviewPanelProps = {
  tasks: GenerationTask[];
  assets: Asset[];
  loading: boolean;
};

export function GenerationPreviewPanel({
  tasks,
  assets,
  loading,
}: GenerationPreviewPanelProps) {
  const activeTask = tasks.find(
    (task) => task.status === 'pending' || task.status === 'processing',
  );
  const latestAsset = assets[0];
  const showProcessing = loading || Boolean(activeTask);
  const prompt =
    typeof latestAsset?.metadata.prompt === 'string'
      ? latestAsset.metadata.prompt
      : undefined;

  return (
    <div className="glass-panel flex h-[500px] flex-col overflow-hidden rounded-xl">
      <div className="flex items-center justify-between border-b border-primary/10 bg-surface-container-high px-md py-sm">
        <span className="text-label-sm flex items-center gap-2 font-bold tracking-widest text-primary">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          输出流
        </span>
        <div className="flex gap-md">
          {latestAsset?.previewUrl ? (
            <a
              href={latestAsset.previewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-on-surface-variant transition-colors hover:text-primary"
            >
              <Icon name="download" />
            </a>
          ) : (
            <button type="button" className="text-on-surface-variant" disabled>
              <Icon name="download" />
            </button>
          )}
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-surface-container-lowest">
        {showProcessing ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/90 p-xl">
            <div className="relative mb-lg flex h-48 w-48 items-center justify-center">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <div
                className="absolute inset-4 animate-spin rounded-full border-2 border-secondary/20 border-b-secondary"
                style={{ animationDirection: 'reverse', animationDuration: '3s' }}
              />
              <Icon name="auto_awesome" className="animate-pulse text-[48px] text-primary" />
            </div>
            <h3 className="text-headline-md mb-2 text-on-surface">合成中…</h3>
            <p className="text-code-md text-on-surface-variant">
              {activeTask
                ? `${activeTask.status === 'pending' ? '排队等待' : '即梦引擎处理中'}`
                : '提交任务中'}
            </p>
            <div className="mt-lg h-1 w-64 overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full w-1/2 animate-pulse bg-primary" />
            </div>
          </div>
        ) : null}

        {!showProcessing && latestAsset?.previewUrl ? (
          <div className="scan-effect absolute inset-0">
            <MediaPreview
              src={latestAsset.previewUrl}
              type={latestAsset.type}
              title={prompt}
              className="absolute inset-0 h-full w-full"
              mediaClassName="h-full w-full object-cover"
            />
            {prompt ? (
              <div className="pointer-events-none absolute bottom-md left-md right-md flex gap-md">
                <div className="glass-panel flex-1 rounded-lg border border-white/10 bg-surface/40 p-sm backdrop-blur-md">
                  <p className="text-label-sm font-bold text-on-surface">提示词</p>
                  <p className="text-xs text-on-surface-variant">{prompt.slice(0, 120)}</p>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {!showProcessing && !latestAsset?.previewUrl ? (
          <div className="flex flex-col items-center gap-sm p-xl text-center">
            <Icon name="image" className="text-5xl text-on-surface-variant" />
            <p className="text-body-md text-on-surface-variant">生成完成后将在此预览</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
