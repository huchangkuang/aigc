import type { ArkContentItem, ArkCreateTaskBody } from '../ark/ark.types';

export type ArkInputParams = {
  prompt: string;
  image_urls?: string[];
  video_urls?: string[];
  audio_urls?: string[];
  aspect_ratio?: string;
  duration?: number;
  generate_audio?: boolean;
  watermark?: boolean;
};

export function buildArkContent(params: ArkInputParams): ArkContentItem[] {
  const content: ArkContentItem[] = [{ type: 'text', text: params.prompt }];

  for (const url of params.image_urls ?? []) {
    content.push({
      type: 'image_url',
      image_url: { url },
      role: 'reference_image',
    });
  }

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
    watermark: params.watermark ?? false,
  };
}
