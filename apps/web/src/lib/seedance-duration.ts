export const MIN_SEEDANCE_DURATION = 4;
export const MAX_SEEDANCE_DURATION = 15;
export const DEFAULT_SEEDANCE_DURATION = 5;

export function listSeedanceDurationOptions() {
  return Array.from(
    { length: MAX_SEEDANCE_DURATION - MIN_SEEDANCE_DURATION + 1 },
    (_, index) => MIN_SEEDANCE_DURATION + index,
  );
}
