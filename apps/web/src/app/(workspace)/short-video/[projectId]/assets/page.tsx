'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EntityCard } from '@/components/entity-card';
import { api, type EntityImageItem } from '@/lib/api-client';
import type { ShortVideoProject } from '@/lib/short-video-types';
import { flattenEntities } from '@/lib/short-video-types';

export default function ProjectAssetsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [project, setProject] = useState<ShortVideoProject | null>(null);
  const [histories, setHistories] = useState<Record<string, EntityImageItem[]>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adoptBusyId, setAdoptBusyId] = useState<string | null>(null);
  const [uploadBusyId, setUploadBusyId] = useState<string | null>(null);

  async function loadHistories(entities: ReturnType<typeof flattenEntities>) {
    const entries = await Promise.all(
      entities.map(async (entity) => {
        const { items } = await api.listEntityImages(projectId, entity.id);
        return [entity.id, items] as const;
      }),
    );
    setHistories(Object.fromEntries(entries));
  }

  async function reload() {
    const projectData = await api.getShortVideoProject(projectId);
    setProject(projectData);
    const entities = flattenEntities(projectData.parsedEntities);
    if (entities.length) {
      await loadHistories(entities);
    } else {
      setHistories({});
    }
  }

  useEffect(() => {
    reload().catch(() => undefined);
  }, [projectId]);

  async function generate(entityId: string, prompt: string) {
    setBusyId(entityId);
    try {
      await api.generateEntityImage(projectId, entityId, prompt);
      await reload();
    } finally {
      setBusyId(null);
    }
  }

  async function adopt(entityId: string, assetId: string) {
    setAdoptBusyId(entityId);
    try {
      await api.adoptEntityImage(projectId, entityId, assetId);
      await reload();
    } finally {
      setAdoptBusyId(null);
    }
  }

  async function upload(entityId: string, file: File) {
    setUploadBusyId(entityId);
    try {
      const uploaded = await api.uploadReference(file);
      await api.uploadEntityImage(projectId, entityId, uploaded.ossKey, file.type);
      await reload();
    } finally {
      setUploadBusyId(null);
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
        <div className="space-y-lg">
          {entities.map((entity) => (
            <EntityCard
              key={entity.id}
              entity={entity}
              historyItems={histories[entity.id] ?? []}
              busy={busyId === entity.id}
              adoptBusy={adoptBusyId === entity.id}
              uploadBusy={uploadBusyId === entity.id}
              onGenerate={(prompt) => generate(entity.id, prompt)}
              onAdopt={(assetId) => adopt(entity.id, assetId)}
              onUpload={(file) => upload(entity.id, file)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
