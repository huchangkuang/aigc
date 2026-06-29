'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/icon';

type MediaLightboxProps = {
  open: boolean;
  onClose: () => void;
  src: string;
  type: 'image' | 'video';
  title?: string;
};

export function MediaLightbox({ open, onClose, src, type, title }: MediaLightboxProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/88 p-md backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title ?? '媒体预览'}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-md top-md flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="关闭预览"
      >
        <Icon name="close" />
      </button>

      <div
        className="media-lightbox-panel flex max-h-[92vh] w-full max-w-6xl flex-col items-center"
        onClick={(event) => event.stopPropagation()}
      >
        {type === 'video' ? (
          <video
            src={src}
            controls
            autoPlay
            className="max-h-[82vh] w-full rounded-xl object-contain shadow-2xl"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={title ?? ''}
            className="max-h-[82vh] w-full rounded-xl object-contain shadow-2xl"
          />
        )}
        {title ? (
          <p className="mt-md max-w-2xl text-center text-sm leading-relaxed text-white/75">
            {title}
          </p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
