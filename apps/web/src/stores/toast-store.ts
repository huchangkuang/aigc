import { create } from 'zustand';

export type ToastItem = {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
};

type ToastStore = {
  toasts: ToastItem[];
  push: (message: string, type?: ToastItem['type']) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (message, type = 'error') => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }));
    }, 4000);
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
}));

export function toast(message: string, type: ToastItem['type'] = 'error') {
  useToastStore.getState().push(message, type);
}
