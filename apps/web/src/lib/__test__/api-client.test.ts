import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiEnvelope, api } from '../api-client';

const toast = vi.fn();

vi.mock('@/stores/toast-store', () => ({
  toast: (...args: unknown[]) => toast(...args),
}));

describe('api envelope handling', () => {
  it('documents success shape', () => {
    const body: ApiEnvelope<{ accessToken: string }> = {
      code: 0,
      message: 'success',
      data: { accessToken: 'jwt' },
    };
    expect(body.code).toBe(0);
    expect(body.data.accessToken).toBe('jwt');
  });

  it('documents error shape', () => {
    const body: ApiEnvelope<null> = {
      code: 401,
      message: 'Invalid email or password',
      data: null,
    };
    expect(body.code).not.toBe(0);
    expect(body.message).toBeTruthy();
  });
});

describe('trash asset api paths', () => {
  it('documents trash endpoints', () => {
    expect(api.listTrashAssets).toBeDefined();
    expect(api.restoreAsset).toBeDefined();
    expect(api.destroyAsset).toBeDefined();
  });
});

describe('generation models api', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls list models endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          code: 0,
          message: 'success',
          data: [{ id: '720', label: '720P' }],
        }),
      }),
    );

    await expect(api.listModels('video_t2v')).resolves.toEqual([
      { id: '720', label: '720P' },
    ]);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/generation/models?type=video_t2v'),
      expect.any(Object),
    );
  });
});

describe('short video api', () => {
  it('documents short video endpoints', () => {
    expect(api.listShortVideoProjects).toBeDefined();
    expect(api.parseShortVideoEntities).toBeDefined();
    expect(api.generateSegmentVideo).toBeDefined();
  });

  it('listAssets supports source query', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ code: 0, message: 'success', data: [] }),
      }),
    );

    await api.listAssets('image', 'short_video');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('type=image'),
      expect.any(Object),
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('source=short_video'),
      expect.any(Object),
    );
  });

  it('calls entity image history endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ code: 0, message: 'success', data: { items: [] } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await api.listEntityImages('p1', 'c1');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/short-video/projects/p1/entities/c1/images'),
      expect.any(Object),
    );

    fetchMock.mockResolvedValueOnce({
      json: async () => ({ code: 0, message: 'success', data: { assetId: 'a1' } }),
    });
    await api.adoptEntityImage('p1', 'c1', 'a1');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/short-video/projects/p1/entities/c1/adopt-image'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ assetId: 'a1' }),
      }),
    );

    fetchMock.mockResolvedValueOnce({
      json: async () => ({
        code: 0,
        message: 'success',
        data: { id: 'a2', previewUrl: 'u', createdAt: 't', adopted: false },
      }),
    });
    await api.uploadEntityImage('p1', 'c1', 'temp/k.png', 'image/png');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/short-video/projects/p1/entities/c1/upload-image'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ ossKey: 'temp/k.png', mimeType: 'image/png' }),
      }),
    );
  });
});

describe('apiFetch error toast', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    toast.mockClear();
  });

  it('shows toast on API error by default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ code: 500, message: '服务器错误', data: null }),
      }),
    );

    await expect(api.listAssets()).rejects.toThrow('服务器错误');
    expect(toast).toHaveBeenCalledWith('服务器错误', 'error');
  });

  it('skips toast when silent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ code: 401, message: 'Invalid email or password', data: null }),
      }),
    );

    await expect(api.login('a@b.com', 'wrong')).rejects.toThrow('Invalid email or password');
    expect(toast).not.toHaveBeenCalled();
  });
});
