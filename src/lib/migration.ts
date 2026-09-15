import type { AppData, Measurement, Theme } from './types';

export const CURRENT_SCHEMA_VERSION = 2;

const DEFAULT_DATA: AppData = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  name: 'Hasan',
  theme: 'system',
  profilePhoto: '',
  habits: {},
  sets: {},
  sleepHours: 0,
  protein: 0,
  proteinTarget: 160,
  water: 0,
  bodyMeasurements: { weight: [], waist: [] },
};

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function finiteNumber(value: unknown, fallback: number) { return typeof value === 'number' && Number.isFinite(value) ? value : fallback; }
function clamp(value: unknown, min: number, max: number, fallback: number) { return Math.min(max, Math.max(min, finiteNumber(value, fallback))); }
function validDate(value: unknown): value is string { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime()); }
function normalizeMeasurements(value: unknown, min: number, max: number): Measurement[] { if (!Array.isArray(value)) return []; return value.flatMap(item => { if (!isRecord(item) || !validDate(item.date)) return []; const numeric = finiteNumber(item.value, NaN); return Number.isFinite(numeric) ? [{ date: item.date, value: Math.min(max, Math.max(min, numeric)) }] : []; }).sort((a, b) => a.date.localeCompare(b.date)); }

export function defaultData(): AppData { return { ...DEFAULT_DATA, habits: {}, sets: {}, bodyMeasurements: { weight: [], waist: [] } }; }

export function isImportableData(raw: unknown) {
  if (!isRecord(raw)) return false;
  const known = ['schemaVersion', 'name', 'theme', 'profilePhoto', 'habits', 'sets', 'sleepHours', 'sleep', 'protein', 'proteinTarget', 'water', 'bodyMeasurements'];
  if (!Object.keys(raw).some(key => known.includes(key))) return false;
  if (!['schemaVersion', 'sets', 'habits', 'sleepHours', 'sleep', 'protein', 'water', 'bodyMeasurements'].some(key => key in raw)) return false;
  if ('habits' in raw && !isRecord(raw.habits)) return false;
  if ('sets' in raw && !isRecord(raw.sets)) return false;
  if ('bodyMeasurements' in raw && !isRecord(raw.bodyMeasurements)) return false;
  return true;
}

export function normalizeData(raw: unknown): AppData {
  if (!isRecord(raw)) return defaultData();
  const theme: Theme = raw.theme === 'dark' || raw.theme === 'light' || raw.theme === 'system' ? raw.theme : DEFAULT_DATA.theme;
  const legacySleep = finiteNumber(raw.sleep, 0);
  const sleepHours = clamp('sleepHours' in raw ? raw.sleepHours : (legacySleep > 24 ? legacySleep / 60 : legacySleep), 0, 24, 0);
  const habits: Record<string, boolean> = {};
  if (isRecord(raw.habits)) Object.entries(raw.habits).forEach(([key, value]) => { if (typeof value === 'boolean' && key.length <= 160) habits[key] = value; });
  const sets: Record<string, number> = {};
  if (isRecord(raw.sets)) Object.entries(raw.sets).forEach(([key, value]) => { if (/^\d{4}-\d{2}-\d{2}-\d+-\d+$/.test(key) && typeof value === 'number' && Number.isFinite(value)) sets[key] = Math.round(Math.min(20, Math.max(0, value))); });
  const body = isRecord(raw.bodyMeasurements) ? raw.bodyMeasurements : {};
  const profilePhoto = typeof raw.profilePhoto === 'string' && raw.profilePhoto.startsWith('data:image/') && raw.profilePhoto.length <= 2_000_000 ? raw.profilePhoto : '';
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 80) : DEFAULT_DATA.name;
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    name,
    theme,
    profilePhoto,
    habits,
    sets,
    sleepHours,
    protein: clamp(raw.protein, 0, 1000, 0),
    proteinTarget: typeof raw.proteinTarget === 'number' && Number.isFinite(raw.proteinTarget) && raw.proteinTarget >= 1 ? Math.min(1000, raw.proteinTarget) : DEFAULT_DATA.proteinTarget,
    water: Math.round(clamp(raw.water, 0, 20, 0)),
    bodyMeasurements: {
      weight: normalizeMeasurements(body.weight, 1, 500),
      waist: normalizeMeasurements(body.waist, 20, 300),
    },
  };
}
