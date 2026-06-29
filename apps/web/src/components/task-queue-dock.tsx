'use client';

import { useState } from 'react';
import { GenerationTaskList } from '@/components/generation-task-list';
import { Icon } from '@/components/icon';
import type { GenerationTask } from '@/lib/api-client';

type TaskQueueDockProps = {
  tasks: GenerationTask[];
};

export function TaskQueueDock({ tasks }: TaskQueueDockProps) {
  const [expanded, setExpanded] = useState(false);

  const doneCount = tasks.filter((task) => task.status === 'done').length;
  const activeCount = tasks.filter(
    (task) => task.status === 'pending' || task.status === 'processing',
  ).length;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-[min(100vw-3rem,380px)] flex-col items-end gap-2">
      {expanded ? (
        <div className="glass-panel w-full overflow-hidden rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="max-h-80 overflow-y-auto p-md">
            <GenerationTaskList tasks={tasks} />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="glass-panel flex w-full items-center justify-between gap-3 rounded-full px-5 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-all hover:border-primary/30"
      >
        <span className="text-sm font-medium text-on-surface">任务队列</span>

        <div className="flex items-center gap-2">
          {activeCount > 0 ? (
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-primary-fixed-dim" />
          ) : null}
          <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs text-on-surface-variant">
            {doneCount} / {tasks.length}
          </span>
          <Icon
            name={expanded ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
            className="text-on-surface-variant"
          />
        </div>
      </button>
    </div>
  );
}
