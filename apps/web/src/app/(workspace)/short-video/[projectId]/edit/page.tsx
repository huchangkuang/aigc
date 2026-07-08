'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SegmentCard } from '@/components/segment-card';
import { api, type AdoptedEntityImageItem, type Asset } from '@/lib/api-client';
import type { ShortVideoProject } from '@/lib/short-video-types';
import type { SegmentPromptDoc } from '@/lib/segment-prompt-doc';

export default function EditPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [project, setProject] = useState<ShortVideoProject | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [mentionItems, setMentionItems] = useState<AdoptedEntityImageItem[]>([]);
  const [parsing, setParsing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reload() {
    const [projectData, assetList, adopted] = await Promise.all([
      api.getShortVideoProject(projectId),
      api.listAssets(undefined, 'short_video'),
      api.listAdoptedEntityImages(projectId),
    ]);
    setProject(projectData);
    setAssets(assetList);
    setMentionItems(adopted.items);
  }

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

  async function savePrompt(
    segmentId: string,
    payload: {
      seedancePrompt: string;
      referenceAssetIds: string[];
      seedancePromptDoc: SegmentPromptDoc;
    },
  ) {
    await api.updateSegmentPrompt(projectId, segmentId, payload);
    setProject((current) => {
      if (!current?.segments) return current;
      return {
        ...current,
        segments: {
          segments: current.segments.segments.map((segment) =>
            segment.id === segmentId
              ? {
                  ...segment,
                  seedancePrompt: payload.seedancePrompt,
                  referenceAssetIds: payload.referenceAssetIds,
                  seedancePromptDoc: payload.seedancePromptDoc,
                }
              : segment,
          ),
        },
      };
    });
  }

  async function generate(
    segmentId: string,
    payload: {
      model: string;
      resolution: string;
      duration: number;
      prompt: string;
      assetIds: string[];
    },
  ) {
    setBusyId(segmentId);
    try {
      await api.generateSegmentVideo(projectId, segmentId, {
        prompt: payload.prompt,
        model: payload.model,
        resolution: payload.resolution,
        duration: payload.duration,
        assetIds: payload.assetIds,
      });
      await reload();
    } finally {
      setBusyId(null);
    }
  }

  function previewForSegment(assetId?: string) {
    if (!assetId) return undefined;
    return assets.find((item) => item.id === assetId && item.type === 'video')?.previewUrl;
  }

  const segments = project?.segments?.segments ?? [];

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
          className="gradient-button rounded-lg px-md py-sm text-sm font-bold text-on-primary disabled:opacity-50"
        >
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
              mentionItems={mentionItems}
              busy={busyId === segment.id}
              previewUrl={previewForSegment(segment.videoAssetId)}
              onBlurSave={(payload) => savePrompt(segment.id, payload)}
              onGenerate={(payload) => generate(segment.id, payload)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
