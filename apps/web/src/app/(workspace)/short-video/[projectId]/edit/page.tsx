'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icon';
import { SegmentCard } from '@/components/segment-card';
import { api, type Asset } from '@/lib/api-client';
import { isActiveTaskStatus } from '@/lib/generation-output';
import type { ShortVideoProject } from '@/lib/short-video-types';
import { flattenEntities } from '@/lib/short-video-types';
import { useGenerationTaskPoll } from '@/lib/use-generation-task-poll';
import { toast } from '@/stores/toast-store';

export default function EditPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [project, setProject] = useState<ShortVideoProject | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [parsing, setParsing] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  async function reload() {
    const [projectData, assetList] = await Promise.all([
      api.getShortVideoProject(projectId),
      api.listAssets(undefined, 'short_video'),
    ]);
    setProject(projectData);
    setAssets(assetList);
  }

  const segments = project?.segments?.segments ?? [];
  const watchedTaskIds = segments.flatMap((segment) =>
    segment.videoTaskId ? [segment.videoTaskId] : [],
  );

  const { isTaskActive } = useGenerationTaskPoll({
    taskIds: watchedTaskIds,
    onSettled: (tasks) => {
      setSubmittingId(null);
      if (tasks.some((task) => task.status === 'failed')) {
        toast('生成失败，请重试', 'error');
      }
      reload().catch(() => undefined);
    },
  });

  useEffect(() => {
    reload().catch(() => undefined);
  }, [projectId]);

  async function parseSegments() {
    setParsing(true);
    try {
      await api.parseShortVideoSegments(projectId);
      await reload();
    } finally {
      setParsing(false);
    }
  }

  async function generate(segmentId: string, model: string) {
    setSubmittingId(segmentId);
    try {
      const task = await api.generateSegmentVideo(projectId, segmentId, model);
      const projectData = await api.getShortVideoProject(projectId);
      setProject(projectData);
      const active = await api.listActiveTasks({ silent: true });
      if (!active.some((item) => item.id === task.id && isActiveTaskStatus(item.status))) {
        await reload();
        setSubmittingId(null);
      }
    } catch {
      setSubmittingId(null);
    }
  }

  function segmentMissingRefs(segment: NonNullable<ShortVideoProject['segments']>['segments'][0]) {
    const entities = flattenEntities(project?.parsedEntities);
    const refs = [
      ...segment.characterRefIds,
      ...(segment.sceneRefId ? [segment.sceneRefId] : []),
      ...segment.propRefIds,
    ];
    return refs.some((id) => !entities.find((item) => item.id === id)?.assetId);
  }

  function previewForSegment(assetId?: string) {
    if (!assetId) return undefined;
    return assets.find((item) => item.id === assetId && item.type === 'video')?.previewUrl;
  }

  return (
    <div className="space-y-md">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <h2 className="text-headline-md text-on-surface">视频编辑</h2>
          <p className="text-sm text-on-surface-variant">解析分镜并逐段生成 Seedance 视频</p>
        </div>
        <button
          type="button"
          disabled={parsing}
          onClick={parseSegments}
          className="gradient-button inline-flex items-center gap-1.5 rounded-lg px-md py-sm text-sm font-bold text-on-primary disabled:opacity-50"
        >
          <Icon
            name={parsing ? 'progress_activity' : 'movie'}
            className={`text-base ${parsing ? 'animate-spin' : ''}`}
          />
          {parsing ? '解析中…' : '解析分镜'}
        </button>
      </div>
      {!segments.length ? (
        <p className="text-on-surface-variant">点击「解析分镜」生成分镜片段</p>
      ) : (
        <div className="space-y-lg">
          {segments.map((segment, index) => (
            <SegmentCard
              key={segment.id}
              segment={segment}
              index={index}
              missingRefs={segmentMissingRefs(segment)}
              generating={
                submittingId === segment.id || isTaskActive(segment.videoTaskId)
              }
              previewUrl={previewForSegment(segment.videoAssetId)}
              onGenerate={(model) => generate(segment.id, model)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
