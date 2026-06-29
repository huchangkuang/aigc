import { create } from 'zustand';
import { api, clearAuthToken, setAuthToken } from '@/lib/api-client';

type AuthUser = { id: string; email: string };

type AuthState = {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
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
