'use client';

import { useState, type ReactNode } from 'react';
import { MediaLightbox } from '@/components/media-lightbox';

type MediaPreviewProps = {
  src: string;
  type: 'image' | 'video';
  title?: string;
  className?: string;
  mediaClassName?: string;
  muted?: boolean;
  children?: ReactNode;
};

export function MediaPreview({
  src,
  type,
  title,
  className,
  mediaClassName,
  muted = true,
  children,
}: MediaPreviewProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${className ?? 'block w-full cursor-zoom-in text-left'} relative`}
        aria-label="放大预览"
      >
        {type === 'video' ? (
          <video
            src={src}
            className={mediaClassName ?? 'h-full w-full object-cover'}
            muted={muted}
            playsInline
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className={mediaClassName ?? 'h-full w-full object-cover'}
          />
        )}
        {children}
      </button>

      <MediaLightbox
        open={open}
        onClose={() => setOpen(false)}
        src={src}
        type={type}
        title={title}
      />
    </>
  );
}
