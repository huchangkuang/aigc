import type { GenerationTask } from '@/lib/api-client';

export function mergeTasksWithStableUrls(
  prev: GenerationTask[],
  next: GenerationTask[],
): GenerationTask[] {
  const prevAssets = new Map<string, { previewUrl?: string; ossKey?: string }>();

  for (const task of prev) {
    for (const asset of task.assets ?? []) {
      prevAssets.set(asset.id, {
        previewUrl: asset.previewUrl,
        ossKey: asset.ossKey,
      });
    }
  }

  return next.map((task) => ({
    ...task,
    assets: task.assets?.map((asset) => {
      const previous = prevAssets.get(asset.id);
      if (
        previous?.previewUrl &&
        previous.ossKey &&
        asset.ossKey &&
        previous.ossKey === asset.ossKey
      ) {
        return { ...asset, previewUrl: previous.previewUrl };
      }
      return asset;
    }),
  }));
}
