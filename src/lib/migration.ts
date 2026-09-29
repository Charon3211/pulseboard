import type { AppData, Exercise, Measurement, SetLog, Theme, WeightUnit } from './types';

export const CURRENT_SCHEMA_VERSION = 3;

const DEFAULT_DATA: AppData = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  name: 'Hasan',
  theme: 'system',
  profilePhoto: '',
  weightUnit: 'kg',
  defaultRestSeconds: 90,
  soundEnabled: true,
  passcode: 'coco1513',
  sets: {},
  setLogs: {},
  customDays: {},
  exerciseNotes: {},
  bodyMeasurements: { weight: [], waist: [] },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  return Math.min(max, Math.max(min, finiteNumber(value, fallback)));
}

function validDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T12:00:00`).getTime())
  );
}

function normalizeMeasurements(value: unknown, min: number, max: number): Measurement[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap(item => {
      if (!isRecord(item) || !validDate(item.date)) return [];
      const numeric = finiteNumber(item.value, NaN);
      return Number.isFinite(numeric) ? [{ date: item.date, value: Math.min(max, Math.max(min, numeric)) }] : [];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

function normalizeSetLogs(raw: unknown): Record<string, SetLog[]> {
  if (!isRecord(raw)) return {};
  const result: Record<string, SetLog[]> = {};
  Object.entries(raw).forEach(([key, list]) => {
    if (!/^\d{4}-\d{2}-\d{2}-\d+-\d+$/.test(key) || !Array.isArray(list)) return;
    const cleanList: SetLog[] = list.map((item, idx) => {
      if (!isRecord(item)) {
        return { setNumber: idx + 1, weight: 0, reps: 0, completed: false };
      }
      return {
        setNumber: typeof item.setNumber === 'number' ? Math.max(1, Math.min(50, item.setNumber)) : idx + 1,
        weight: clamp(item.weight, 0, 1500, 0),
        reps: Math.round(clamp(item.reps, 0, 500, 0)),
        completed: Boolean(item.completed),
      };
    });
    if (cleanList.length > 0) {
      result[key] = cleanList;
    }
  });
  return result;
}

function normalizeExercises(list: unknown): Exercise[] {
  if (!Array.isArray(list)) return [];
  return list.flatMap(item => {
    if (!isRecord(item) || typeof item.name !== 'string' || !item.name.trim()) return [];
    return [
      {
        name: item.name.trim().slice(0, 100),
        equipment: typeof item.equipment === 'string' ? item.equipment.slice(0, 50) : 'Bodyweight',
        sets: Math.round(clamp(item.sets, 1, 20, 3)),
        reps: typeof item.reps === 'string' ? item.reps.slice(0, 50) : '8–12',
        muscle: typeof item.muscle === 'string' ? item.muscle.slice(0, 50) : 'Full Body',
        notes: typeof item.notes === 'string' ? item.notes.slice(0, 200) : undefined,
      },
    ];
  });
}

function normalizeCustomDays(raw: unknown): Record<number, Exercise[]> {
  if (!isRecord(raw)) return {};
  const result: Record<number, Exercise[]> = {};
  Object.entries(raw).forEach(([key, val]) => {
    const dayNum = Number(key);
    if (!Number.isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) {
      const clean = normalizeExercises(val);
      if (clean.length > 0) result[dayNum] = clean;
    }
  });
  return result;
}

export function defaultData(): AppData {
  return {
    ...DEFAULT_DATA,
    sets: {},
    setLogs: {},
    customDays: {},
    exerciseNotes: {},
    bodyMeasurements: { weight: [], waist: [] },
  };
}

export function isImportableData(raw: unknown): boolean {
  if (!isRecord(raw)) return false;
  const known = [
    'schemaVersion',
    'name',
    'theme',
    'profilePhoto',
    'weightUnit',
    'defaultRestSeconds',
    'soundEnabled',
    'passcode',
    'sets',
    'setLogs',
    'customDays',
    'exerciseNotes',
    'bodyMeasurements',
    // legacy fields
    'habits',
    'sleepHours',
    'sleep',
    'protein',
    'proteinTarget',
    'water',
  ];
  return Object.keys(raw).some(key => known.includes(key));
}

export function normalizeData(raw: unknown): AppData {
  if (!isRecord(raw)) return defaultData();
  const theme: Theme =
    raw.theme === 'dark' || raw.theme === 'light' || raw.theme === 'system' ? raw.theme : DEFAULT_DATA.theme;
  const weightUnit: WeightUnit = raw.weightUnit === 'lbs' ? 'lbs' : 'kg';
  const defaultRestSeconds = Math.round(clamp(raw.defaultRestSeconds, 10, 600, DEFAULT_DATA.defaultRestSeconds));
  const soundEnabled = typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : true;
  const passcode = typeof raw.passcode === 'string' && raw.passcode.trim() ? raw.passcode.trim().slice(0, 50) : DEFAULT_DATA.passcode;

  const sets: Record<string, number> = {};
  if (isRecord(raw.sets)) {
    Object.entries(raw.sets).forEach(([key, value]) => {
      if (/^\d{4}-\d{2}-\d{2}-\d+-\d+$/.test(key) && typeof value === 'number' && Number.isFinite(value)) {
        sets[key] = Math.round(Math.min(50, Math.max(0, value)));
      }
    });
  }

  const setLogs = normalizeSetLogs(raw.setLogs);
  const customDays = normalizeCustomDays(raw.customDays);

  const exerciseNotes: Record<string, string> = {};
  if (isRecord(raw.exerciseNotes)) {
    Object.entries(raw.exerciseNotes).forEach(([key, val]) => {
      if (typeof val === 'string' && val.trim()) {
        exerciseNotes[key] = val.trim().slice(0, 300);
      }
    });
  }

  const body = isRecord(raw.bodyMeasurements) ? raw.bodyMeasurements : {};
  const profilePhoto =
    typeof raw.profilePhoto === 'string' &&
    raw.profilePhoto.startsWith('data:image/') &&
    raw.profilePhoto.length <= 2_000_000
      ? raw.profilePhoto
      : '';
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 80) : DEFAULT_DATA.name;

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    name,
    theme,
    profilePhoto,
    weightUnit,
    defaultRestSeconds,
    soundEnabled,
    passcode,
    sets,
    setLogs,
    customDays,
    exerciseNotes,
    bodyMeasurements: {
      weight: normalizeMeasurements(body.weight, 1, 500),
      waist: normalizeMeasurements(body.waist, 20, 300),
    },
    // Preserve legacy if present
    habits: isRecord(raw.habits) ? (raw.habits as Record<string, boolean>) : undefined,
  };
}
