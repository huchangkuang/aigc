import { create } from 'zustand';

interface AppState {
  apiStatus: 'idle' | 'loading' | 'ok' | 'error';
  setApiStatus: (status: AppState['apiStatus']) => void;
}

export const useAppStore = create<AppState>((set) => ({
  apiStatus: 'idle',
  setApiStatus: (apiStatus) => set({ apiStatus }),
}));
