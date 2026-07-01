'use client';

import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/icon';
import { MediaLightbox } from '@/components/media-lightbox';

type MediaPreviewProps = {
  src: string;
  type: 'image' | 'video';
  title?: string;
  variant?: 'thumbnail' | 'full';
  className?: string;
  mediaClassName?: string;
  muted?: boolean;
  children?: ReactNode;
};

export function MediaPreview({
  src,
  type,
  title,
  variant = 'full',
  className,
  mediaClassName,
  muted = true,
  children,
}: MediaPreviewProps) {
  const [open, setOpen] = useState(false);
  const isVideo = type === 'video';
  const useVideoThumbnail = isVideo && variant === 'thumbnail';

  function showVideoPoster(event: React.SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget;
    if (video.currentTime === 0) {
      video.currentTime = 0.1;
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${className ?? 'block w-full text-left'} relative ${
          isVideo ? 'cursor-pointer' : 'cursor-zoom-in'
        }`}
        aria-label={isVideo ? '播放预览' : '放大预览'}
      >
        {useVideoThumbnail ? (
          <video
            src={src}
            className={mediaClassName ?? 'h-full w-full object-cover'}
            muted={muted}
            playsInline
            preload="metadata"
            onLoadedMetadata={showVideoPoster}
          />
        ) : isVideo ? (
          <video
            src={src}
            className={mediaClassName ?? 'h-full w-full object-cover'}
            muted={muted}
            playsInline
            preload="metadata"
            onLoadedMetadata={showVideoPoster}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className={mediaClassName ?? 'h-full w-full object-cover'}
          />
        )}

        {isVideo ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-105">
              <Icon name="play_arrow" className="ml-0.5 text-2xl text-white" />
            </div>
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity hover:bg-black/20 hover:opacity-100">
            <Icon name="zoom_in" className="text-3xl text-white/90" />
          </div>
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
