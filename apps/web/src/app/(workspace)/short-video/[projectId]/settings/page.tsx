'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { api } from '@/lib/api-client';
import { useProject } from '../project-context';

export default function SettingsPage() {
  const router = useRouter();
  const { project, updateProject } = useProject();
  const [title, setTitle] = useState(project.title);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function saveTitle() {
    const name = title.trim();
    if (!name || name === project.title) return;
    setSaving(true);
    try {
      const updated = await api.updateShortVideoProject(project.id, { title: name });
      updateProject(updated);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject() {
    setDeleting(true);
    try {
      await api.deleteShortVideoProject(project.id);
      router.push('/short-video');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-md">
      <div>
        <h2 className="text-headline-md text-on-surface">项目设置</h2>
        <p className="text-sm text-on-surface-variant">修改项目名称或删除项目</p>
      </div>

      <section className="glass-panel w-full max-w-[32rem] space-y-sm rounded-xl p-md">
        <label className="block text-sm font-medium text-on-surface" htmlFor="project-title">
          项目名称
        </label>
        <input
          id="project-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-sm text-on-surface outline-none focus:border-primary"
        />
        <button
          type="button"
          disabled={saving || !title.trim() || title.trim() === project.title}
          onClick={saveTitle}
          className="gradient-button rounded-lg px-md py-sm text-sm font-bold text-on-primary disabled:opacity-50"
        >
          {saving ? '保存中…' : '保存名称'}
        </button>
      </section>

      <section className="glass-panel w-full max-w-[32rem] space-y-sm rounded-xl border border-error/20 p-md">
        <h3 className="text-sm font-medium text-error">危险操作</h3>
        <p className="text-sm text-on-surface-variant">删除后项目内的剧本、解析结果将无法恢复。</p>
        <button
          type="button"
          disabled={deleting}
          onClick={() => setDeleteOpen(true)}
          className="rounded-lg border border-error/40 px-md py-sm text-sm font-medium text-error transition hover:bg-error/10 disabled:opacity-50"
        >
          删除项目
        </button>
      </section>

      <ConfirmDialog
        open={deleteOpen}
        title="删除项目"
        description={`确认删除「${project.title}」？此操作不可撤销。`}
        confirmLabel="删除"
        onConfirm={deleteProject}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
