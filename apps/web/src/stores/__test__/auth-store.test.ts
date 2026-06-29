import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../auth-store';

vi.mock('@/lib/api-client', () => ({
  api: {
    login: vi.fn(),
  },
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
}));

import { api, clearAuthToken, setAuthToken } from '@/lib/api-client';

describe('auth-store', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null });
    vi.clearAllMocks();
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
