import type { Asset } from '@/lib/api-client';

export function getAssetDisplayTitle(asset: Asset) {
  const title = asset.metadata.title;
  if (typeof title === 'string' && title.trim()) {
    return title.trim().slice(0, 40);
  }

  const prompt = asset.metadata.prompt;
  if (typeof prompt === 'string' && prompt.trim()) {
    return prompt.trim().slice(0, 40);
  }

  return asset.type === 'video' ? '未命名视频' : '未命名图片';
}
