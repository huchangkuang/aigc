import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../auth-store';

vi.mock('@/lib/api-client', () => ({
  api: {
    login: vi.fn(),
  },
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
  getAuthToken: vi.fn(),
}));

import { api, clearAuthToken, getAuthToken, setAuthToken } from '@/lib/api-client';

function fakeJwt(payload: Record<string, string>) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `hdr.${body}.sig`;
}

describe('auth-store', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null });
    vi.clearAllMocks();
  });

  it('hydrates user from auth-token cookie', () => {
    vi.mocked(getAuthToken).mockReturnValue(
      fakeJwt({ sub: '1', email: 'a@b.com' }),
    );

    useAuthStore.getState().hydrateFromCookie();

    expect(useAuthStore.getState().user).toEqual({ id: '1', email: 'a@b.com' });
  });

  it('stores user after login', async () => {
    vi.mocked(api.login).mockResolvedValue({
      accessToken: 'jwt',
      user: { id: '1', email: 'a@b.com' },
    });

    await useAuthStore.getState().login('a@b.com', 'secret');

    expect(setAuthToken).toHaveBeenCalledWith('jwt');
    expect(useAuthStore.getState().user).toEqual({ id: '1', email: 'a@b.com' });
  });

  it('clears user on logout', () => {
    useAuthStore.setState({ user: { id: '1', email: 'a@b.com' } });
    useAuthStore.getState().logout();
    expect(clearAuthToken).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
