import type { GenerationTask, TaskAsset } from '@/lib/api-client';

export const GENERATION_SUBMIT_MESSAGE = '任务已提交，正在生成…';

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

export function resolveSessionSubmitMessage(
  sessionTasks: GenerationTask[],
): string | null {
  if (sessionTasks.length === 0) return null;
  if (hasActiveTasks(sessionTasks)) return null;
  if (sessionTasks.some((task) => task.status === 'failed')) {
    return '生成失败，请重试';
  }
  if (sessionTasks.some((task) => task.status === 'done')) {
    return '生成完成';
  }
  return '';
}
