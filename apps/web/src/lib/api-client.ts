const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

export type LoginResponse = {
  accessToken: string;
  user: { id: string; email: string };
};

export type GenerationTask = {
  id: string;
  type: string;
  status: string;
  errorMessage?: string | null;
  inputParams: Record<string, unknown>;
  assets?: Array<{ id: string; type: string }>;
  createdAt: string;
};

export type Asset = {
  id: string;
  type: 'image' | 'video';
  previewUrl?: string;
  mimeType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
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

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
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
    throw new Error(response.statusText || '请求失败');
  }

  if (body.code !== 0) {
    throw new Error(body.message || '请求失败');
  }

  return body.data;
}

export const api = {
  login(email: string, password: string) {
    return apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  listTasks() {
    return apiFetch<GenerationTask[]>('/generation-tasks');
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
  uploadReference(file: File) {
    const form = new FormData();
    form.append('file', file);
    return apiFetch<{ url: string; ossKey: string }>('/storage/upload', {
      method: 'POST',
      body: form,
    });
  },
};
