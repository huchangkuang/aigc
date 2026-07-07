import type { ArkContentItem, ArkCreateTaskBody } from '../ark/ark.types';
import {
  DEFAULT_SEEDANCE_RESOLUTION,
  type SeedanceContentMode,
} from './generation-capabilities';

export type ArkInputParams = {
  prompt: string;
  mode?: SeedanceContentMode;
  image_urls?: string[];
  video_urls?: string[];
  audio_urls?: string[];
  aspect_ratio?: string;
  duration?: number;
  resolution?: string;
  generate_audio?: boolean;
  watermark?: boolean;
};

function imageRole(
  mode: SeedanceContentMode,
  index: number,
): 'reference_image' | 'first_frame' | 'last_frame' {
  if (mode === 'i2v_first') return 'first_frame';
  if (mode === 'i2v_first_tail') {
    return index === 0 ? 'first_frame' : 'last_frame';
  }
  return 'reference_image';
}

export function buildArkContent(params: ArkInputParams): ArkContentItem[] {
  const mode = params.mode ?? 'r2v';
  const content: ArkContentItem[] = [{ type: 'text', text: params.prompt }];

  for (const [index, url] of (params.image_urls ?? []).entries()) {
    content.push({
      type: 'image_url',
      image_url: { url },
      role: imageRole(mode, index),
    });
  }

  if (mode === 'r2v') {
    for (const url of params.video_urls ?? []) {
      content.push({
        type: 'video_url',
        video_url: { url },
        role: 'reference_video',
      });
    }

    for (const url of params.audio_urls ?? []) {
      content.push({
        type: 'audio_url',
        audio_url: { url },
        role: 'reference_audio',
      });
    }
  }

  return content;
}

export function buildArkCreateBody(
  model: string,
  params: ArkInputParams,
): ArkCreateTaskBody {
  return {
    model,
    content: buildArkContent(params),
    generate_audio: params.generate_audio ?? true,
    ratio: params.aspect_ratio ?? '16:9',
    duration: params.duration ?? 5,
    resolution: params.resolution ?? DEFAULT_SEEDANCE_RESOLUTION,
    watermark: params.watermark ?? false,
  };
}
