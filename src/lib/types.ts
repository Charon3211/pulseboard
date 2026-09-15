export type Theme = 'light' | 'dark' | 'system';

export type Exercise = {
  name: string;
  equipment: string;
  sets: number;
  reps: string;
  muscle: string;
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

export type AppData = {
  schemaVersion: number;
  name: string;
  theme: Theme;
  profilePhoto: string;
  habits: Record<string, boolean>;
  sets: Record<string, number>;
  sleepHours: number;
  protein: number;
  proteinTarget: number;
  water: number;
  bodyMeasurements: {
    weight: Measurement[];
    waist: Measurement[];
  };
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

export type WeeklySummary = {
  weekStart: string;
  completed: number;
  partial: number;
  absent: number;
  totalSets: number;
  habitChecks: number;
  days: { iso: string; index: number; sets: number; percent: number; status: WorkoutStatus }[];
};
