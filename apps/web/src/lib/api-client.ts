import { toast } from '@/stores/toast-store';
import type { ShortVideoProject, ShortVideoProjectSummary } from '@/lib/short-video-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type ApiOptions = {
  /** 为 true 时不弹出错误 toast（登录 inline、轮询等场景） */
  silent?: boolean;
};

export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

export type LoginResponse = {
  accessToken: string;
  user: { id: string; email: string };
};

export type TaskAsset = {
  id: string;
  type: 'image' | 'video';
  ossKey?: string;
  previewUrl?: string;
  mimeType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type GenerationTask = {
  id: string;
  type: string;
  status: string;
  errorMessage?: string | null;
  inputParams: Record<string, unknown>;
  assets?: TaskAsset[];
  createdAt: string;
};

export type ActiveGenerationTask = {
  id: string;
  type: string;
  status: string;
  errorMessage?: string | null;
  createdAt: string;
};

export type Asset = {
  id: string;
  type: 'image' | 'video';
  source?: 'material' | 'short_video';
  ossKey?: string;
  previewUrl?: string;
  mimeType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  deletedAt?: string;
};

export type GenerationModelOption = {
  id: string;
  label: string;
};

export type EntityImageItem = {
  id: string;
  previewUrl: string;
  createdAt: string;
  adopted: boolean;
};

export type AdoptedEntityImageItem = {
  assetId: string;
  entityId: string;
  entityName: string;
  entityKind: 'character' | 'scene' | 'prop';
  previewUrl: string;
};

export type ComposeContext = {
  assetId: string;
  assetType: 'image' | 'video';
  prompt?: string;
  imageUrls: string[];
  generationType?: string;
  frames?: number;
  aspectRatio?: string;
  templateId?: string;
  cameraStrength?: string;
  model?: string;
};

function getToken() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )auth-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setAuthToken(token: string) {
  document.cookie = `auth-token=${encodeURIComponent(token)}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
}

export function clearAuthToken() {
  document.cookie = 'auth-token=; path=/; max-age=0';
}

function fail(message: string, silent?: boolean): never {
  if (!silent) toast(message, 'error');
  throw new Error(message);
}

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options: ApiOptions = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  let body: ApiEnvelope<T>;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    fail(response.statusText || '请求失败', options.silent);
  }

  if (body.code !== 0) {
    fail(body.message || '请求失败', options.silent);
  }

  return body.data;
}

export const api = {
  login(email: string, password: string) {
    return apiFetch<LoginResponse>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      { silent: true },
    );
  },
  listTasks(options?: ApiOptions) {
    return apiFetch<GenerationTask[]>('/generation-tasks', {}, options);
  },
  listActiveTasks(options?: ApiOptions) {
    return apiFetch<ActiveGenerationTask[]>('/generation-tasks/active', {}, options);
  },
  getGenerationTask(id: string, options?: ApiOptions) {
    return apiFetch<GenerationTask>(`/generation-tasks/${id}`, {}, options);
  },
  listModels(type: string, options?: ApiOptions) {
    return apiFetch<GenerationModelOption[]>(
      `/generation/models?type=${encodeURIComponent(type)}`,
      {},
      options,
    );
  },
  createTask(body: Record<string, unknown>) {
    return apiFetch<GenerationTask>('/generation-tasks', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  listAssets(type?: string, source?: string) {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (source) params.set('source', source);
    const query = params.toString();
    return apiFetch<Asset[]>(`/assets${query ? `?${query}` : ''}`);
  },
  renameAsset(id: string, title: string) {
    return apiFetch<Asset>(`/assets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  },
  deleteAsset(id: string) {
    return apiFetch<{ id: string }>(`/assets/${id}`, {
      method: 'DELETE',
    });
  },
  listTrashAssets(type?: string, source?: string) {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (source) params.set('source', source);
    const query = params.toString();
    return apiFetch<Asset[]>(`/assets/trash${query ? `?${query}` : ''}`);
  },
  restoreAsset(id: string) {
    return apiFetch<Asset>(`/assets/${id}/restore`, {
      method: 'POST',
    });
  },
  destroyAsset(id: string) {
    return apiFetch<{ id: string }>(`/assets/${id}/permanent`, {
      method: 'DELETE',
    });
  },
  getComposeContext(id: string) {
    return apiFetch<ComposeContext>(`/assets/${id}/compose-context`);
  },
  uploadReference(file: File) {
    const form = new FormData();
    form.append('file', file);
    return apiFetch<{ url: string; ossKey: string }>('/storage/upload', {
      method: 'POST',
      body: form,
    });
  },
  listShortVideoProjects() {
    return apiFetch<ShortVideoProjectSummary[]>('/short-video/projects');
  },
  createShortVideoProject(title: string) {
    return apiFetch<ShortVideoProject>('/short-video/projects', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },
  getShortVideoProject(id: string) {
    return apiFetch<ShortVideoProject>(`/short-video/projects/${id}`);
  },
  updateShortVideoProject(id: string, body: { title?: string; rawScript?: string }) {
    return apiFetch<ShortVideoProject>(`/short-video/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
  deleteShortVideoProject(id: string) {
    return apiFetch<{ id: string }>(`/short-video/projects/${id}`, {
      method: 'DELETE',
    });
  },
  parseShortVideoEntities(id: string) {
    return apiFetch<ShortVideoProject>(`/short-video/projects/${id}/parse-entities`, {
      method: 'POST',
    });
  },
  parseShortVideoSegments(id: string) {
    return apiFetch<ShortVideoProject>(`/short-video/projects/${id}/parse-segments`, {
      method: 'POST',
    });
  },
  generateEntityImage(projectId: string, entityId: string, prompt?: string) {
    return apiFetch<GenerationTask>(
      `/short-video/projects/${projectId}/entities/${entityId}/generate-image`,
      {
        method: 'POST',
        body: JSON.stringify(prompt ? { prompt } : {}),
      },
    );
  },
  listEntityImages(projectId: string, entityId: string) {
    return apiFetch<{ items: EntityImageItem[] }>(
      `/short-video/projects/${projectId}/entities/${entityId}/images`,
    );
  },
  adoptEntityImage(projectId: string, entityId: string, assetId: string) {
    return apiFetch<{ assetId: string }>(
      `/short-video/projects/${projectId}/entities/${entityId}/adopt-image`,
      {
        method: 'POST',
        body: JSON.stringify({ assetId }),
      },
    );
  },
  uploadEntityImage(
    projectId: string,
    entityId: string,
    ossKey: string,
    mimeType: string,
  ) {
    return apiFetch<EntityImageItem>(
      `/short-video/projects/${projectId}/entities/${entityId}/upload-image`,
      {
        method: 'POST',
        body: JSON.stringify({ ossKey, mimeType }),
      },
    );
  },
  listAdoptedEntityImages(projectId: string) {
    return apiFetch<{ items: AdoptedEntityImageItem[] }>(
      `/short-video/projects/${projectId}/adopted-entity-images`,
    );
  },
  updateSegmentPrompt(
    projectId: string,
    segmentId: string,
    body: {
      seedancePrompt: string;
      referenceAssetIds: string[];
      seedancePromptDoc: Record<string, unknown>;
    },
  ) {
    return apiFetch<{ id: string }>(
      `/short-video/projects/${projectId}/segments/${segmentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );
  },
  generateSegmentVideo(
    projectId: string,
    segmentId: string,
    body: { prompt: string; model?: string; assetIds?: string[] },
  ) {
    return apiFetch<GenerationTask>(
      `/short-video/projects/${projectId}/segments/${segmentId}/generate-video`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
  },
};
