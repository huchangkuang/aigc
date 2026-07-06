'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api-client';
import {
  GENERATION_TASK_POLL_INTERVAL_MS,
  isActiveTaskStatus,
} from '@/lib/generation-output';

type SettledTask = {
  id: string;
  status: string;
  errorMessage?: string | null;
};

type UseGenerationTaskPollOptions = {
  taskIds: string[];
  onSettled?: (tasks: SettledTask[]) => void;
};

export function useGenerationTaskPoll({ taskIds, onSettled }: UseGenerationTaskPollOptions) {
  const ids = taskIds.filter(Boolean);
  const idsKey = ids.join('|');
  const [activeTaskIds, setActiveTaskIds] = useState<string[]>([]);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  useEffect(() => {
    const sawActiveRef = { current: false };

    if (!ids.length) {
      setActiveTaskIds([]);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function poll() {
      const activeList = await api.listActiveTasks({ silent: true });
      if (cancelled) return;

      const watchedActive = activeList.filter(
        (task) => ids.includes(task.id) && isActiveTaskStatus(task.status),
      );

      if (watchedActive.length > 0) {
        sawActiveRef.current = true;
        setActiveTaskIds(watchedActive.map((task) => task.id));
        return;
      }

      setActiveTaskIds([]);

      if (!sawActiveRef.current) return;

      sawActiveRef.current = false;
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }

      const settled = await Promise.all(
        ids.map(async (id) => {
          try {
            const task = await api.getGenerationTask(id, { silent: true });
            return { id, status: task.status, errorMessage: task.errorMessage };
          } catch {
            return { id, status: 'done' };
          }
        }),
      );
      onSettledRef.current?.(settled);
    }

    poll().catch(() => undefined);
    timer = setInterval(() => poll().catch(() => undefined), GENERATION_TASK_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [idsKey]);

  function isTaskActive(taskId?: string) {
    return taskId ? activeTaskIds.includes(taskId) : false;
  }

  return { activeTaskIds, isTaskActive };
}
