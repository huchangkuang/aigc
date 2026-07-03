'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  GenerationComposer,
  type GenerationType,
  type ReferencePreview,
} from '@/components/generation-composer';
import { GenerationPreviewPanel } from '@/components/generation-preview-panel';
import { TaskQueueDock } from '@/components/task-queue-dock';
import { api, type GenerationTask } from '@/lib/api-client';
import { hasActiveTasks, resolveSessionSubmitMessage, GENERATION_SUBMIT_MESSAGE } from '@/lib/generation-output';
import { mergeTasksWithStableUrls } from '@/lib/merge-tasks-stable-urls';
import { consumeComposerDraft } from '@/stores/composer-draft-store';
import { toast } from '@/stores/toast-store';

const MAX_REFERENCE_IMAGES = 14;
const MAX_REFERENCE_VIDEOS = 3;
const MAX_REFERENCE_AUDIOS = 3;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const TASK_POLL_INTERVAL_MS = 5000;

type PendingReference = {
  id: string;
  previewUrl: string;
};

function parseUrls(raw: string) {
  return raw
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildReferencePreviews(
  urls: string,
  pending: PendingReference[],
): ReferencePreview[] {
  const confirmed = parseUrls(urls).map((url, index) => ({
    id: `confirmed-${index}`,
    src: url,
  }));
  const uploading = pending.map((item) => ({
    id: item.id,
    src: item.previewUrl,
    uploading: true as const,
  }));
  return [...confirmed, ...uploading];
}

export default function GeneratePage() {
  const [type, setType] = useState<GenerationType>('image');
  const [model, setModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [pendingRefs, setPendingRefs] = useState<PendingReference[]>([]);
  const [videoUrls, setVideoUrls] = useState('');
  const [pendingVideoRefs, setPendingVideoRefs] = useState<PendingReference[]>([]);
  const [audioUrls, setAudioUrls] = useState('');
  const [pendingAudioRefs, setPendingAudioRefs] = useState<PendingReference[]>([]);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [frames, setFrames] = useState(121);
  const [duration, setDuration] = useState(5);
  const [templateId, setTemplateId] = useState('hitchcock_dolly_in');
  const [cameraStrength, setCameraStrength] = useState('medium');
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const sessionTaskIdsRef = useRef<string[]>([]);
  const [pollingTasks, setPollingTasks] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function updateSessionTaskIds(ids: string[]) {
    sessionTaskIdsRef.current = ids;
  }

  async function refreshSession(ids = sessionTaskIdsRef.current) {
    if (ids.length === 0) {
      setTasks([]);
      setPollingTasks(false);
      return;
    }

    const data = await api.listTasks({ silent: true });
    const session = data.filter((task) => ids.includes(task.id));
    setTasks((current) => {
      const merged = mergeTasksWithStableUrls(current, session);
      setPollingTasks(hasActiveTasks(merged));
      return merged;
    });
  }

  async function resumeActiveSession() {
    const active = await api.listActiveTasks({ silent: true });
    if (active.length === 0) return;

    const ids = active.map((task) => task.id);
    updateSessionTaskIds(ids);
    await refreshSession(ids);
  }

  async function pollActive() {
    const active = await api.listActiveTasks({ silent: true });
    if (active.length === 0) {
      await refreshSession();
      return;
    }

    const activeIds = active.map((item) => item.id);
    const mergedIds = Array.from(new Set([...sessionTaskIdsRef.current, ...activeIds]));
    if (mergedIds.length !== sessionTaskIdsRef.current.length) {
      updateSessionTaskIds(mergedIds);
    }

    setTasks((prev) => {
      let updated = prev.map((task) => {
        const match = active.find((item) => item.id === task.id);
        if (!match) return task;
        return {
          ...task,
          status: match.status,
          errorMessage: match.errorMessage,
        };
      });

      for (const item of active) {
        if (!prev.some((task) => task.id === item.id)) {
          updated = [
            {
              ...item,
              inputParams: {},
              assets: [],
            },
            ...updated,
          ];
        }
      }

      setPollingTasks(true);
      return updated;
    });
  }

  const references = useMemo(
    () => buildReferencePreviews(imageUrls, pendingRefs),
    [imageUrls, pendingRefs],
  );
  const videoReferences = useMemo(
    () => buildReferencePreviews(videoUrls, pendingVideoRefs),
    [videoUrls, pendingVideoRefs],
  );
  const audioReferences = useMemo(
    () => buildReferencePreviews(audioUrls, pendingAudioRefs),
    [audioUrls, pendingAudioRefs],
  );

  useEffect(() => {
    resumeActiveSession().catch(() => undefined);
  }, []);

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
      if (draft.model) setModel(draft.model);
      if (draft.frames !== undefined) setFrames(draft.frames);
      if (draft.aspectRatio) setAspectRatio(draft.aspectRatio);
      if (draft.templateId) setTemplateId(draft.templateId);
      if (draft.cameraStrength) setCameraStrength(draft.cameraStrength);
    }
  }, []);

  useEffect(() => {
    if (!pollingTasks) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer !== null) return;
      timer = setInterval(() => {
        pollActive().catch(() => undefined);
      }, TASK_POLL_INTERVAL_MS);
    };

    const stop = () => {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stop();
        return;
      }
      pollActive().catch(() => undefined);
      start();
    };

    if (document.visibilityState !== 'hidden') {
      start();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [pollingTasks]);

  useEffect(() => {
    if (pollingTasks || message !== GENERATION_SUBMIT_MESSAGE) return;

    const sessionTasks = tasks.filter((task) =>
      sessionTaskIdsRef.current.includes(task.id),
    );
    const next = resolveSessionSubmitMessage(sessionTasks);
    if (next !== null) setMessage(next);
  }, [pollingTasks, tasks, message]);

  function removeUrlAtIndex(raw: string, index: number) {
    return parseUrls(raw)
      .filter((_, i) => i !== index)
      .join('\n');
  }

  function removeReference(id: string) {
    if (id.startsWith('confirmed-')) {
      const index = Number(id.replace('confirmed-', ''));
      if (!Number.isNaN(index)) {
        setImageUrls(removeUrlAtIndex(imageUrls, index));
      }
      return;
    }

    setPendingRefs((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  function removeVideoReference(id: string) {
    if (id.startsWith('confirmed-')) {
      const index = Number(id.replace('confirmed-', ''));
      if (!Number.isNaN(index)) {
        setVideoUrls(removeUrlAtIndex(videoUrls, index));
      }
      return;
    }

    setPendingVideoRefs((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  function removeAudioReference(id: string) {
    if (id.startsWith('confirmed-')) {
      const index = Number(id.replace('confirmed-', ''));
      if (!Number.isNaN(index)) {
        setAudioUrls(removeUrlAtIndex(audioUrls, index));
      }
      return;
    }

    setPendingAudioRefs((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  async function uploadReferenceFile(params: {
    file: File;
    maxBytes: number;
    maxCount: number;
    currentUrls: string;
    pending: PendingReference[];
    setUrls: (value: string) => void;
    setPending: React.Dispatch<React.SetStateAction<PendingReference[]>>;
    limitMessage: string;
    sizeMessage: string;
    successMessage: string;
    previewType?: 'image' | 'video' | 'audio';
  }) {
    const {
      file,
      maxBytes,
      maxCount,
      currentUrls,
      pending,
      setUrls,
      setPending,
      limitMessage,
      sizeMessage,
      successMessage,
      previewType = 'image',
    } = params;

    if (parseUrls(currentUrls).length + pending.length >= maxCount) {
      toast(limitMessage, 'error');
      return;
    }

    if (file.size > maxBytes) {
      toast(sizeMessage, 'error');
      return;
    }

    const id = crypto.randomUUID();
    const previewUrl =
      previewType === 'audio' ? '' : URL.createObjectURL(file);
    setPending((prev) => [...prev, { id, previewUrl }]);

    try {
      const result = await api.uploadReference(file);
      setUrls((prev) => (prev ? `${prev}\n${result.url}` : result.url));
      toast(successMessage, 'success');
    } finally {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPending((prev) => prev.filter((item) => item.id !== id));
    }
  }

  async function onUploadFile(file: File) {
    await uploadReferenceFile({
      file,
      maxBytes: MAX_IMAGE_BYTES,
      maxCount: MAX_REFERENCE_IMAGES,
      currentUrls: imageUrls,
      pending: pendingRefs,
      setUrls: setImageUrls,
      setPending: setPendingRefs,
      limitMessage: '参考图数量已达上限',
      sizeMessage: '图片大小不能超过 10MB',
      successMessage: '参考图已上传',
    });
  }

  async function onUploadVideoFile(file: File) {
    await uploadReferenceFile({
      file,
      maxBytes: MAX_VIDEO_BYTES,
      maxCount: MAX_REFERENCE_VIDEOS,
      currentUrls: videoUrls,
      pending: pendingVideoRefs,
      setUrls: setVideoUrls,
      setPending: setPendingVideoRefs,
      limitMessage: '参考视频数量已达上限',
      sizeMessage: '视频大小不能超过 200MB',
      successMessage: '参考视频已上传',
      previewType: 'video',
    });
  }

  async function onUploadAudioFile(file: File) {
    await uploadReferenceFile({
      file,
      maxBytes: MAX_AUDIO_BYTES,
      maxCount: MAX_REFERENCE_AUDIOS,
      currentUrls: audioUrls,
      pending: pendingAudioRefs,
      setUrls: setAudioUrls,
      setPending: setPendingAudioRefs,
      limitMessage: '参考音频数量已达上限',
      sizeMessage: '音频大小不能超过 15MB',
      successMessage: '参考音频已上传',
      previewType: 'audio',
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (
      pendingRefs.length > 0 ||
      pendingVideoRefs.length > 0 ||
      pendingAudioRefs.length > 0
    ) {
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const body: Record<string, unknown> = { type, prompt };
      if (model) body.model = model;

      if (type !== 'image') {
        if (type === 'video_seedance_r2v') {
          body.duration = duration;
          body.generate_audio = true;
          body.watermark = false;
        } else {
          body.frames = frames;
        }
      }

      if (type === 'video_t2v' || type === 'video_seedance_r2v') {
        body.aspect_ratio = aspectRatio;
      }

      if (imageUrls.trim()) {
        body.image_urls = parseUrls(imageUrls);
      }

      if (type === 'video_seedance_r2v') {
        const parsedVideoUrls = parseUrls(videoUrls).slice(0, MAX_REFERENCE_VIDEOS);
        const parsedAudioUrls = parseUrls(audioUrls).slice(0, MAX_REFERENCE_AUDIOS);
        if (parsedVideoUrls.length) body.video_urls = parsedVideoUrls;
        if (parsedAudioUrls.length) body.audio_urls = parsedAudioUrls;
      }

      if (type === 'video_i2v_recamera') {
        body.template_id = templateId;
        body.camera_strength = cameraStrength;
      }

      const created = await api.createTask(body);
      const nextIds = [created.id, ...sessionTaskIdsRef.current];
      updateSessionTaskIds(nextIds);
      setMessage(GENERATION_SUBMIT_MESSAGE);
      toast(GENERATION_SUBMIT_MESSAGE, 'success');
      await refreshSession(nextIds);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-gutter">
      <div className="flex flex-col justify-between gap-md md:flex-row md:items-end">
        <div>
          <h2 className="text-headline-lg text-on-surface">创作中心</h2>
          <p className="mt-1 text-on-surface-variant">
            即梦生图/视频 + 火山方舟 Seedance 2.0 多模态视频
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <span className="text-label-sm flex items-center gap-1 rounded-full border border-secondary-container/30 bg-secondary-container/20 px-3 py-1 text-on-secondary-container">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary-fixed-dim" />
            即梦 API 已连接
          </span>
          <span className="text-label-sm rounded-full border border-outline-variant bg-surface-container-high px-3 py-1 text-on-surface-variant">
            Seedance 2.0
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 lg:col-span-7">
          <GenerationComposer
            type={type}
            onTypeChange={setType}
            model={model}
            onModelChange={setModel}
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
            videoReferences={videoReferences}
            onRemoveVideoReference={removeVideoReference}
            onUploadVideoFile={onUploadVideoFile}
            audioReferences={audioReferences}
            onRemoveAudioReference={removeAudioReference}
            onUploadAudioFile={onUploadAudioFile}
            duration={duration}
            onDurationChange={setDuration}
            loading={loading}
            message={message}
            onUploadFile={onUploadFile}
            onSubmit={onSubmit}
          />
        </div>

        <div className="col-span-12 lg:col-span-5">
          <GenerationPreviewPanel tasks={tasks} loading={loading} />
        </div>
      </div>

      <TaskQueueDock tasks={tasks} />
    </div>
  );
}
