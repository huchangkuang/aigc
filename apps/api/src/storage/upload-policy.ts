export type UploadKind = 'image' | 'video' | 'audio';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime']);
const AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
]);

export function resolveUploadKind(mimeType: string): UploadKind | null {
  if (IMAGE_TYPES.has(mimeType)) return 'image';
  if (VIDEO_TYPES.has(mimeType)) return 'video';
  if (AUDIO_TYPES.has(mimeType)) return 'audio';
  return null;
}

export function maxBytesForKind(kind: UploadKind): number {
  if (kind === 'image') return 10 * 1024 * 1024;
  if (kind === 'video') return 200 * 1024 * 1024;
  return 15 * 1024 * 1024;
}

export function uploadKindLabel(kind: UploadKind): string {
  if (kind === 'image') return 'JPG、PNG、WEBP 图片';
  if (kind === 'video') return 'MP4、MOV 视频';
  return 'MP3、WAV 音频';
}
