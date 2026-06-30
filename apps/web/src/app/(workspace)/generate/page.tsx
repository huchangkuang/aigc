'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  GenerationComposer,
  type GenerationType,
  type ReferencePreview,
} from '@/components/generation-composer';
import { GenerationHistoryGrid } from '@/components/generation-history-grid';
import { GenerationPreviewPanel } from '@/components/generation-preview-panel';
import { TaskQueueDock } from '@/components/task-queue-dock';
import { api, type GenerationTask } from '@/lib/api-client';
import { hasActiveTasks } from '@/lib/generation-output';
import { consumeComposerDraft } from '@/stores/composer-draft-store';
import { toast } from '@/stores/toast-store';

const MAX_REFERENCE_IMAGES = 14;
const TASK_POLL_INTERVAL_MS = 5000;

type PendingReference = {
  id: string;
  previewUrl: string;
};

function parseImageUrls(raw: string) {
  return raw
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function GeneratePage() {
  const [type, setType] = useState<GenerationType>('image');
  const [prompt, setPrompt] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [pendingRefs, setPendingRefs] = useState<PendingReference[]>([]);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [frames, setFrames] = useState(121);
  const [templateId, setTemplateId] = useState('hitchcock_dolly_in');
  const [cameraStrength, setCameraStrength] = useState('medium');
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [pollingTasks, setPollingTasks] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshTasks = useCallback(async () => {
    const data = await api.listTasks();
    setTasks(data);
    setPollingTasks(hasActiveTasks(data));
    return data;
  }, []);

  const references = useMemo<ReferencePreview[]>(() => {
    const confirmed = parseImageUrls(imageUrls).map((url, index) => ({
      id: `confirmed-${index}`,
      src: url,
    }));
    const pending = pendingRefs.map((item) => ({
      id: item.id,
      src: item.previewUrl,
      uploading: true,
    }));
    return [...confirmed, ...pending];
  }, [imageUrls, pendingRefs]);

  useEffect(() => {
    refreshTasks().catch(() => undefined);
  }, [refreshTasks]);

  useEffect(() => {
    const draft = consumeComposerDraft();
    if (!draft) return;

    if (draft.mode === 'similar' || draft.mode === 'promptOnly') {
      if (draft.prompt !== undefined) setPrompt(draft.prompt);
    }

    if (draft.mode === 'similar' || draft.mode === 'imageOnly') {
      setImageUrls(draft.imageUrls?.length ? draft.imageUrls.join('\n') : '');
    }

    if (draft.mode === 'promptOnly') {
      setImageUrls('');
    }

    if (draft.mode === 'similar') {
      if (draft.type) setType(draft.type);
      if (draft.frames !== undefined) setFrames(draft.frames);
      if (draft.aspectRatio) setAspectRatio(draft.aspectRatio);
      if (draft.templateId) setTemplateId(draft.templateId);
      if (draft.cameraStrength) setCameraStrength(draft.cameraStrength);
    }
  }, []);

  useEffect(() => {
    if (!pollingTasks) return;

    const timer = setInterval(() => {
      refreshTasks().catch(() => undefined);
    }, TASK_POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [pollingTasks, refreshTasks]);

  function removeReference(id: string) {
    if (id.startsWith('confirmed-')) {
      const index = Number(id.replace('confirmed-', ''));
      const urls = parseImageUrls(imageUrls);
      if (!Number.isNaN(index)) {
        setImageUrls(urls.filter((_, i) => i !== index).join('\n'));
      }
      return;
    }

    setPendingRefs((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  async function onUploadFile(file: File) {
    const confirmedCount = parseImageUrls(imageUrls).length;
    if (confirmedCount + pendingRefs.length >= MAX_REFERENCE_IMAGES) {
      toast('参考图数量已达上限', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast('图片大小不能超过 10MB', 'error');
      return;
    }

    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);
    setPendingRefs((prev) => [...prev, { id, previewUrl }]);

    try {
      const result = await api.uploadReference(file);
      setImageUrls((prev) => (prev ? `${prev}\n${result.url}` : result.url));
      toast('参考图已上传', 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : '上传失败', 'error');
    } finally {
      URL.revokeObjectURL(previewUrl);
      setPendingRefs((prev) => prev.filter((item) => item.id !== id));
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pendingRefs.length > 0) return;

    setLoading(true);
    setMessage('');
    try {
      const body: Record<string, unknown> = { type, prompt };

      if (type !== 'image') {
        body.frames = frames;
      }

      if (type === 'video_t2v') body.aspect_ratio = aspectRatio;

      if (imageUrls.trim()) {
        body.image_urls = parseImageUrls(imageUrls);
      }

      if (type === 'video_i2v_recamera') {
        body.template_id = templateId;
        body.camera_strength = cameraStrength;
      }

      await api.createTask(body);
      setMessage('任务已提交，正在生成…');
      toast('任务已提交，正在生成…', 'success');
      await refreshTasks();
    } catch (error) {
      const text = error instanceof Error ? error.message : '提交失败';
      setMessage(text);
      toast(text, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-gutter">
      <div className="flex flex-col justify-between gap-md md:flex-row md:items-end">
        <div>
          <h2 className="text-headline-lg text-on-surface">创作中心</h2>
          <p className="mt-1 text-on-surface-variant">接入即梦引擎，将创意转化为图片与视频素材</p>
        </div>
        <div className="flex items-center gap-sm">
          <span className="text-label-sm flex items-center gap-1 rounded-full border border-secondary-container/30 bg-secondary-container/20 px-3 py-1 text-on-secondary-container">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary-fixed-dim" />
            即梦 API 已连接
          </span>
          <span className="text-label-sm rounded-full border border-outline-variant bg-surface-container-high px-3 py-1 text-on-surface-variant">
            Seedance 3.0
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-7">
          <GenerationComposer
            type={type}
            onTypeChange={setType}
            prompt={prompt}
            onPromptChange={setPrompt}
            references={references}
            onRemoveReference={removeReference}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            frames={frames}
            onFramesChange={setFrames}
            templateId={templateId}
            onTemplateIdChange={setTemplateId}
            cameraStrength={cameraStrength}
            onCameraStrengthChange={setCameraStrength}
            loading={loading}
            message={message}
            onUploadFile={onUploadFile}
            onSubmit={onSubmit}
          />
        </div>

        <div className="col-span-12 space-y-gutter lg:col-span-5">
          <GenerationPreviewPanel tasks={tasks} loading={loading} />
          <GenerationHistoryGrid tasks={tasks} />
        </div>
      </div>

      <TaskQueueDock tasks={tasks} />
    </div>
  );
}
