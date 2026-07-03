'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EntityCard } from '@/components/entity-card';
import { api, type Asset, type ShortVideoProject } from '@/lib/api-client';
import { flattenEntities } from '@/lib/short-video-types';

export default function ProjectAssetsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [project, setProject] = useState<ShortVideoProject | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reload() {
    const [projectData, assetList] = await Promise.all([
      api.getShortVideoProject(projectId),
      api.listAssets('image', 'short_video'),
    ]);
    setProject(projectData);
    setAssets(assetList);
  }

  useEffect(() => {
    reload().catch(() => undefined);
  }, [projectId]);

  function previewForEntity(assetId?: string) {
    if (!assetId) return undefined;
    return assets.find((item) => item.id === assetId)?.previewUrl;
  }

  async function generate(entityId: string, prompt: string) {
    setBusyId(entityId);
    try {
      await api.generateEntityImage(projectId, entityId, prompt);
      await reload();
    } finally {
      setBusyId(null);
    }
  }

  const entities = flattenEntities(project?.parsedEntities);

  return (
    <div className="space-y-md">
      <div>
        <h2 className="text-headline-md text-on-surface">资产</h2>
        <p className="text-sm text-on-surface-variant">手动为每个实体生成参考图（可跳过）</p>
      </div>
      {!entities.length ? (
        <p className="text-on-surface-variant">请先在剧本页解析实体</p>
      ) : (
        <div className="space-y-md">
          {entities.map((entity) => (
            <EntityCard
              key={entity.id}
              entity={entity}
              previewUrl={previewForEntity(entity.assetId)}
              busy={busyId === entity.id}
              onGenerate={(prompt) => generate(entity.id, prompt)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
