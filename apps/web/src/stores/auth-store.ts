import { create } from 'zustand';
import { api, clearAuthToken, getAuthToken, setAuthToken } from '@/lib/api-client';

type AuthUser = { id: string; email: string };

type AuthState = {
  user: AuthUser | null;
  hydrateFromCookie: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

function readUserFromToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as {
      sub?: string;
      email?: string;
    };
    if (!payload.sub || !payload.email) return null;
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  hydrateFromCookie() {
    if (get().user) return;
    const token = getAuthToken();
    if (!token) return;
    const user = readUserFromToken(token);
    if (user) set({ user });
  },
  async login(email, password) {
    const result = await api.login(email, password);
    setAuthToken(result.accessToken);
    set({ user: result.user });
  },
  logout() {
    clearAuthToken();
    set({ user: null });
  },
}));
