'use client';

import { Icon } from '@/components/icon';
import { useToastStore } from '@/stores/toast-store';

const tone: Record<string, string> = {
  error: 'border-error/40 bg-error/10 text-error',
  success: 'border-primary/30 bg-primary/10 text-primary',
  info: 'border-outline-variant/40 bg-surface-container-high text-on-surface',
};

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-6 top-20 z-[100] flex w-[min(100vw-3rem,360px)] flex-col gap-2">
      {toasts.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md ${tone[item.type]}`}
        >
          <Icon
            name={
              item.type === 'error'
                ? 'error'
                : item.type === 'success'
                  ? 'check_circle'
                  : 'info'
            }
            className="mt-0.5 shrink-0 text-base"
          />
          <p className="flex-1 leading-snug">{item.message}</p>
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
          >
            <Icon name="close" className="text-base" />
          </button>
        </div>
      ))}
    </div>
  );
}
