import { toast } from '@/stores/toast-store';

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
  ossKey?: string;
  previewUrl?: string;
  mimeType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  deletedAt?: string;
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
  createTask(body: Record<string, unknown>) {
    return apiFetch<GenerationTask>('/generation-tasks', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  listAssets(type?: string) {
    const query = type ? `?type=${type}` : '';
    return apiFetch<Asset[]>(`/assets${query}`);
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
  listTrashAssets(type?: string) {
    const query = type ? `?type=${type}` : '';
    return apiFetch<Asset[]>(`/assets/trash${query}`);
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
};
