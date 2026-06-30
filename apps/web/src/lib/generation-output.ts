import type { GenerationTask, TaskAsset } from '@/lib/api-client';

export function hasActiveTasks(tasks: GenerationTask[]) {
  return tasks.some(
    (task) => task.status === 'pending' || task.status === 'processing',
  );
}

export function collectOutputAssets(tasks: GenerationTask[]): TaskAsset[] {
  const assets: TaskAsset[] = [];

  for (const task of tasks) {
    if (task.status !== 'done' || !task.assets?.length) continue;
    for (const asset of task.assets) {
      if (asset.previewUrl) assets.push(asset);
    }
  }

  return assets;
}

export function getLatestOutputAsset(tasks: GenerationTask[]) {
  return collectOutputAssets(tasks)[0];
}
