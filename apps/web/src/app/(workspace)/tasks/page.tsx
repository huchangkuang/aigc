'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { GenerationTaskList } from '@/components/generation-task-list';
import { Icon } from '@/components/icon';
import { api, type GenerationTask } from '@/lib/api-client';
import { hasActiveTasks } from '@/lib/generation-output';

const TASK_POLL_INTERVAL_MS = 5000;

export default function TasksPage() {
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);

  async function loadTasks() {
    const data = await api.listTasks();
    setTasks(data);
    setPolling(hasActiveTasks(data));
  }

  useEffect(() => {
    loadTasks().catch((err) => setError(err instanceof Error ? err.message : '加载失败'));
  }, []);

  useEffect(() => {
    if (!polling) return;

    const timer = setInterval(() => {
      loadTasks().catch(() => undefined);
    }, TASK_POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [polling]);

  return (
    <div className="space-y-gutter">
      <section className="flex flex-col justify-between gap-md md:flex-row md:items-end">
        <div>
          <h2 className="text-headline-lg text-on-surface">任务中心</h2>
          <p className="mt-1 text-on-surface-variant">查看全部生成任务的状态与历史记录</p>
        </div>
        <Link
          href="/generate"
          className="gradient-button inline-flex items-center gap-sm self-start rounded-lg px-md py-sm text-sm font-bold text-on-primary md:self-auto"
        >
          <Icon name="auto_awesome" className="text-base" />
          去生成素材
        </Link>
      </section>

      {error ? (
        <p className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      <div className="glass-panel rounded-xl p-md">
        <GenerationTaskList tasks={tasks} listClassName="max-h-none" />
      </div>
    </div>
  );
}
