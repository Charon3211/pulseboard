export type Theme = 'light' | 'dark' | 'system';
export type WeightUnit = 'kg' | 'lbs';

export type Exercise = {
  name: string;
  equipment: string;
  sets: number;
  reps: string;
  muscle: string;
  notes?: string;
};

export type WorkoutDay = {
  dow: string;
  long: string;
  type: string;
  focus: string;
  ex: Exercise[];
};

export type Measurement = {
  date: string;
  value: number;
};

export type SetLog = {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
};

export type AppData = {
  schemaVersion: number;
  name: string;
  theme: Theme;
  profilePhoto: string;
  weightUnit: WeightUnit;
  defaultRestSeconds: number;
  soundEnabled: boolean;
  passcode: string;
  // Legacy set count tracking (for compatibility: `${iso}-${dayIndex}-${exerciseIndex}` => count)
  sets: Record<string, number>;
  // Detailed set logs: `${iso}-${dayIndex}-${exerciseIndex}` => SetLog[]
  setLogs: Record<string, SetLog[]>;
  // Custom exercises per day (overrides/additions)
  customDays?: Record<number, Exercise[]>;
  // Exercise notes: `${exerciseName}` => note string
  exerciseNotes: Record<string, string>;
  bodyMeasurements: {
    weight: Measurement[];
    waist: Measurement[];
  };
  // Kept for backward compatibility when importing old backups
  habits?: Record<string, boolean>;
  sleepHours?: number;
  protein?: number;
  proteinTarget?: number;
  water?: number;
};

export type Weather = {
  temperature: number;
  apparent: number;
  wind: number;
  code: number;
  fetchedAt: number;
};

export type WeatherStatus = 'idle' | 'locating' | 'loading' | 'ready' | 'offline' | 'denied' | 'error';
export type WorkoutStatus = 'completed' | 'partial' | 'absent' | 'rest' | 'upcoming';

export type DaySummary = {
  iso: string;
  index: number;
  sets: number;
  volume: number;
  percent: number;
  status: WorkoutStatus;
};

export type WeeklySummary = {
  weekStart: string;
  completed: number;
  partial: number;
  absent: number;
  totalSets: number;
  totalVolume: number;
  days: DaySummary[];
};

export type PersonalRecord = {
  exerciseName: string;
  maxWeight: number;
  repsAtMax: number;
  estimated1RM: number;
  date: string;
};
