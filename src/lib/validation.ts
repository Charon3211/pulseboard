export type NumericField = 'sleepHours' | 'protein' | 'proteinTarget' | 'water' | 'weight' | 'waist';

const LIMITS: Record<NumericField, { min: number; max: number; integer?: boolean }> = {
  sleepHours: { min: 0, max: 24 },
  protein: { min: 0, max: 1000 },
  proteinTarget: { min: 1, max: 1000 },
  water: { min: 0, max: 20, integer: true },
  weight: { min: 1, max: 500 },
  waist: { min: 20, max: 300 },
};

export function parseNumericInput(value: string, field: NumericField) {
  const limits = LIMITS[field];
  if (value.trim() === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < limits.min || parsed > limits.max) return null;
  return limits.integer ? Math.round(parsed) : parsed;
}

export function formatSignedChange(value: number, unit: string) {
  if (value === 0) return `0 ${unit}`;
  return `${value > 0 ? '+' : ''}${value.toFixed(value % 1 ? 1 : 0)} ${unit}`;
}
