'use client';

import type { GenerationTask } from '@/lib/api-client';
import { Icon } from '@/components/icon';

const typeLabel: Record<string, string> = {
  image: '文生图',
  video_t2v: '文生视频',
  video_i2v_first: '图生视频·首帧',
  video_i2v_first_tail: '图生视频·首尾帧',
  video_i2v_recamera: '图生视频·运镜',
};

const statusLabel: Record<string, string> = {
  pending: '排队中',
  processing: '生成中',
  done: '已完成',
  failed: '失败',
};

const statusColor: Record<string, string> = {
  pending: 'text-on-surface-variant',
  processing: 'text-primary animate-pulse',
  done: 'text-primary-fixed-dim',
  failed: 'text-error',
};

export function GenerationTaskList({
  tasks,
  emptyMessage = '暂无任务记录',
  listClassName = 'max-h-64',
}: {
  tasks: GenerationTask[];
  emptyMessage?: string;
  listClassName?: string;
}) {
  if (!tasks.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg py-8 text-center">
        <Icon name="hourglass_empty" className="mb-3 text-3xl text-on-surface-variant" />
        <p className="text-sm text-on-surface-variant">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className={`space-y-3 overflow-y-auto ${listClassName}`}>
      {tasks.map((task) => (
        <li
          key={task.id}
          className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-3 transition-all hover:border-primary/30"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Icon
                  name={task.type.includes('video') ? 'videocam' : 'image'}
                  className="text-primary text-lg"
                />
                <p className="truncate font-bold text-on-surface">
                  {typeLabel[task.type] ?? task.type}
                </p>
              </div>
              <p className="mt-2 line-clamp-2 font-mono text-xs text-on-surface-variant">
                {String(task.inputParams.prompt ?? '')}
              </p>
            </div>
            <span className={`shrink-0 text-xs font-medium tracking-wider ${statusColor[task.status] ?? ''}`}>
              {statusLabel[task.status] ?? task.status}
            </span>
          </div>
          {task.errorMessage ? (
            <p className="mt-3 rounded-md border border-error/20 bg-error/10 px-2 py-1 text-xs text-error">
              {task.errorMessage}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
