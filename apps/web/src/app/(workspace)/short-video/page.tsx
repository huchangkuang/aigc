'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RenameDialog } from '@/components/confirm-dialog';
import { Icon } from '@/components/icon';
import { api } from '@/lib/api-client';
import type { ShortVideoProjectSummary } from '@/lib/short-video-types';
import { flattenEntities } from '@/lib/short-video-types';

export default function ShortVideoListPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ShortVideoProjectSummary[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  function loadProjects() {
    api.listShortVideoProjects().then(setProjects).catch(() => undefined);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleCreate(title: string) {
    if (!title) return;
    setCreating(true);
    try {
      const project = await api.createShortVideoProject(title);
      setCreateOpen(false);
      router.push(`/short-video/${project.id}/script`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-gutter">
      <section className="flex flex-col justify-between gap-md md:flex-row md:items-end">
        <div>
          <h2 className="text-headline-lg text-on-surface">短视频项目</h2>
          <p className="mt-1 text-on-surface-variant">剧本解析、资产生图与分镜视频生成</p>
        </div>
        <button
          type="button"
          disabled={creating}
          onClick={() => setCreateOpen(true)}
          className="gradient-button rounded-lg px-md py-sm text-sm font-bold text-on-primary disabled:opacity-50"
        >
          创建项目
        </button>
      </section>

      <RenameDialog
        key={createOpen ? 'create-open' : 'create-closed'}
        open={createOpen}
        initialTitle=""
        heading="新建短视频项目"
        ariaLabel="新建短视频项目"
        confirmLabel="创建"
        placeholder="输入项目名称"
        onConfirm={handleCreate}
        onCancel={() => setCreateOpen(false)}
      />

      {!projects.length ? (
        <div className="glass-panel rounded-xl border-2 border-dashed border-primary/20 p-xl text-center">
          <Icon name="movie" className="mb-md text-5xl text-on-surface-variant" />
          <p className="text-on-surface-variant">还没有短视频项目</p>
        </div>
      ) : (
        <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const entityCount = flattenEntities(project.parsedEntities).length;
            const segmentCount = project.segments?.segments.length ?? 0;
            return (
              <Link
                key={project.id}
                href={`/short-video/${project.id}/script`}
                className="glass-panel rounded-xl p-md transition hover:border-primary/30"
              >
                <h3 className="font-bold text-on-surface">{project.title}</h3>
                <p className="text-label-sm mt-2 text-on-surface-variant">
                  实体 {entityCount} · 片段 {segmentCount}
                </p>
                <p className="text-label-sm mt-1 text-on-surface-variant">
                  更新于 {new Date(project.updatedAt).toLocaleString()}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
