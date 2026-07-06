'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icon';
import { api } from '@/lib/api-client';
import type { ShortVideoProject } from '@/lib/short-video-types';
import { flattenEntities } from '@/lib/short-video-types';

export default function ScriptPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [project, setProject] = useState<ShortVideoProject | null>(null);
  const [script, setScript] = useState('');
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);

  function reload() {
    return api.getShortVideoProject(projectId).then((data) => {
      setProject(data);
      setScript(data.rawScript);
    });
  }

  useEffect(() => {
    reload().catch(() => undefined);
  }, [projectId]);

  async function saveScript() {
    setSaving(true);
    try {
      const updated = await api.updateShortVideoProject(projectId, { rawScript: script });
      setProject(updated);
    } finally {
      setSaving(false);
    }
  }

  async function parseEntities() {
    setParsing(true);
    try {
      await api.updateShortVideoProject(projectId, { rawScript: script });
      const updated = await api.parseShortVideoEntities(projectId);
      setProject(updated);
      setScript(updated.rawScript);
    } finally {
      setParsing(false);
    }
  }

  const entityCount = flattenEntities(project?.parsedEntities).length;

  return (
    <div className="space-y-md">
      <div>
        <h2 className="text-headline-md text-on-surface">剧本</h2>
        <p className="text-sm text-on-surface-variant">输入剧本后解析角色、场景与道具</p>
      </div>
      <textarea
        value={script}
        onChange={(event) => setScript(event.target.value)}
        disabled={parsing}
        rows={16}
        className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-md text-sm text-on-surface outline-none focus:border-primary disabled:opacity-60"
        placeholder="在此粘贴或输入短视频剧本…"
      />
      <div className="flex flex-wrap items-center gap-sm">
        <button
          type="button"
          disabled={saving || parsing}
          onClick={saveScript}
          className="rounded-lg border border-outline-variant px-md py-sm text-sm font-medium disabled:opacity-50"
        >
          {saving ? '保存中…' : '保存剧本'}
        </button>
        <button
          type="button"
          disabled={parsing || !script.trim()}
          onClick={parseEntities}
          className="gradient-button inline-flex items-center gap-1.5 rounded-lg px-md py-sm text-sm font-bold text-on-primary disabled:opacity-50"
        >
          <Icon
            name={parsing ? 'progress_activity' : 'auto_awesome'}
            className={`text-base ${parsing ? 'animate-spin' : ''}`}
          />
          {parsing ? '解析中…' : '解析角色/场景/道具'}
        </button>
        {entityCount > 0 ? (
          <span className="text-sm text-on-surface-variant">已解析 {entityCount} 个实体</span>
        ) : null}
      </div>
    </div>
  );
}
