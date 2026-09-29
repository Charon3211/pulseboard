export type NumericField = 'weight' | 'waist' | 'setWeight' | 'setReps' | 'restSeconds';

const LIMITS: Record<NumericField, { min: number; max: number; integer?: boolean }> = {
  weight: { min: 1, max: 500 },
  waist: { min: 20, max: 300 },
  setWeight: { min: 0, max: 1500 },
  setReps: { min: 0, max: 500, integer: true },
  restSeconds: { min: 5, max: 600, integer: true },
};

export function parseNumericInput(value: string, field: NumericField): number | null {
  const limits = LIMITS[field];
  if (!limits) return null;
  if (value.trim() === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < limits.min || parsed > limits.max) return null;
  return limits.integer ? Math.round(parsed) : parsed;
}

export function formatSignedChange(value: number, unit: string) {
  if (value === 0) return `0 ${unit}`;
  return `${value > 0 ? '+' : ''}${value.toFixed(value % 1 ? 1 : 0)} ${unit}`;
}

export function formatSecondsToTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatVolume(volume: number, unit: string): string {
  if (volume >= 1000000) {
    return `${(volume / 1000).toFixed(1)}k ${unit}`;
  }
  if (volume >= 1000) {
    return `${volume.toLocaleString()} ${unit}`;
  }
  return `${volume} ${unit}`;
}
