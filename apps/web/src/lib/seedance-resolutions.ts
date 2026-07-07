export const DEFAULT_SEEDANCE_RESOLUTION = '720p';

const SEEDANCE_RESOLUTIONS: Record<string, readonly string[]> = {
  '2.0': ['480p', '720p', '1080p', '4k'],
  '2.0-fast': ['480p', '720p'],
  '2.0-mini': ['480p', '720p'],
};

const RESOLUTION_LABELS: Record<string, string> = {
  '480p': '480P',
  '720p': '720P',
  '1080p': '1080P',
  '4k': '4K',
};

export function listSeedanceResolutionOptions(model: string) {
  const values = SEEDANCE_RESOLUTIONS[model] ?? SEEDANCE_RESOLUTIONS['2.0'];
  return values.map((value) => ({
    value,
    label: RESOLUTION_LABELS[value] ?? value,
  }));
}
