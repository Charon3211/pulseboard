import { PROGRAM } from './program';
import type { AppData, Exercise, Measurement, PersonalRecord, SetLog, WeeklySummary, WorkoutStatus } from './types';

export function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dayIndexForISO(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return (new Date(year, month - 1, day).getDay() + 6) % 7;
}

export function weekDate(reference: Date, index: number) {
  const result = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const todayIndex = (reference.getDay() + 6) % 7;
  result.setDate(result.getDate() - todayIndex + index);
  return result;
}

export function selectedWorkoutDate(reference: Date, selectedDay: number) {
  return dateKey(weekDate(reference, selectedDay));
}

export function getExercisesForDay(data: AppData, dayIndex: number): Exercise[] {
  if (data.customDays && data.customDays[dayIndex]) {
    return data.customDays[dayIndex];
  }
  return PROGRAM[dayIndex]?.ex || [];
}

export function getSetLogs(
  data: AppData,
  iso: string,
  dayIndex: number,
  exerciseIndex: number,
  defaultSets = 3
): SetLog[] {
  const key = `${iso}-${dayIndex}-${exerciseIndex}`;
  if (data.setLogs && data.setLogs[key] && data.setLogs[key].length > 0) {
    return data.setLogs[key];
  }

  // Fallback to legacy count in data.sets
  const legacyCount = data.sets ? data.sets[key] || 0 : 0;
  return Array.from({ length: defaultSets }, (_, i) => ({
    setNumber: i + 1,
    weight: 0,
    reps: 0,
    completed: i < legacyCount,
  }));
}

export function progressFor(data: AppData, iso: string, index = dayIndexForISO(iso)) {
  const exercises = getExercisesForDay(data, index);
  if (!exercises.length) return 0;

  const complete = exercises.filter((exercise, exerciseIndex) => {
    const key = `${iso}-${index}-${exerciseIndex}`;
    if (data.setLogs && data.setLogs[key]) {
      const logs = data.setLogs[key];
      const completedCount = logs.filter(l => l.completed).length;
      return completedCount >= exercise.sets;
    }
    return (data.sets?.[key] || 0) >= exercise.sets;
  }).length;

  return Math.round((complete / exercises.length) * 100);
}

export function workoutStatus(
  data: AppData,
  iso: string,
  index: number,
  reference = new Date()
): WorkoutStatus {
  const exercises = getExercisesForDay(data, index);
  if (!exercises.length) return 'rest';

  let loggedSets = 0;
  exercises.forEach((_, exerciseIndex) => {
    const key = `${iso}-${index}-${exerciseIndex}`;
    if (data.setLogs && data.setLogs[key]) {
      loggedSets += data.setLogs[key].filter(l => l.completed).length;
    } else {
      loggedSets += Math.max(0, data.sets?.[key] || 0);
    }
  });

  const percent = progressFor(data, iso, index);
  if (percent >= 100) return 'completed';
  if (loggedSets > 0) return 'partial';
  if (new Date(`${iso}T23:59:59`).getTime() > reference.getTime()) return 'upcoming';
  return 'absent';
}

export function calculateDayVolume(data: AppData, iso: string, dayIndex: number): number {
  const exercises = getExercisesForDay(data, dayIndex);
  let volume = 0;
  exercises.forEach((_, exerciseIndex) => {
    const key = `${iso}-${dayIndex}-${exerciseIndex}`;
    const logs = data.setLogs?.[key];
    if (logs) {
      logs.forEach(s => {
        if (s.completed && s.weight > 0 && s.reps > 0) {
          volume += s.weight * s.reps;
        }
      });
    }
  });
  return Math.round(volume);
}

export function calculateTotalVolume(data: AppData): number {
  let total = 0;
  if (!data.setLogs) return total;
  Object.values(data.setLogs).forEach(logs => {
    if (Array.isArray(logs)) {
      logs.forEach(s => {
        if (s.completed && s.weight > 0 && s.reps > 0) {
          total += s.weight * s.reps;
        }
      });
    }
  });
  return Math.round(total);
}

export function getPreviousPerformance(
  data: AppData,
  exerciseName: string,
  currentISO: string
): { bestWeight: number; bestReps: number; lastLog: string } | null {
  if (!data.setLogs) return null;

  // Search backwards through all keys
  const keys = Object.keys(data.setLogs)
    .filter(k => k.slice(0, 10) < currentISO)
    .sort()
    .reverse();

  for (const key of keys) {
    const parts = key.split('-');
    if (parts.length < 5) continue;
    const iso = parts.slice(0, 3).join('-');
    const dayIndex = Number(parts[3]);
    const exerciseIndex = Number(parts[4]);

    const exercises = getExercisesForDay(data, dayIndex);
    const exercise = exercises[exerciseIndex];
    if (exercise && exercise.name.toLowerCase() === exerciseName.toLowerCase()) {
      const logs = data.setLogs[key].filter(s => s.completed && (s.weight > 0 || s.reps > 0));
      if (logs.length > 0) {
        // Find best set
        const best = logs.reduce((prev, curr) => (curr.weight > prev.weight ? curr : prev), logs[0]);
        return {
          bestWeight: best.weight,
          bestReps: best.reps,
          lastLog: `${best.weight > 0 ? `${best.weight} ${data.weightUnit}` : ''} × ${best.reps} reps (${iso.slice(5)})`,
        };
      }
    }
  }
  return null;
}

export function getPersonalRecord(data: AppData, exerciseName: string): PersonalRecord | null {
  if (!data.setLogs) return null;
  let maxWeight = 0;
  let repsAtMax = 0;
  let max1RM = 0;
  let bestDate = '';

  Object.entries(data.setLogs).forEach(([key, logs]) => {
    const parts = key.split('-');
    if (parts.length < 5) return;
    const iso = parts.slice(0, 3).join('-');
    const dayIndex = Number(parts[3]);
    const exerciseIndex = Number(parts[4]);

    const exercises = getExercisesForDay(data, dayIndex);
    const exercise = exercises[exerciseIndex];
    if (exercise && exercise.name.toLowerCase() === exerciseName.toLowerCase()) {
      logs.forEach(s => {
        if (s.completed && s.weight > 0 && s.reps > 0) {
          const est1RM = Math.round(s.weight * (1 + s.reps / 30));
          if (s.weight > maxWeight || (s.weight === maxWeight && s.reps > repsAtMax)) {
            maxWeight = s.weight;
            repsAtMax = s.reps;
            bestDate = iso;
          }
          if (est1RM > max1RM) {
            max1RM = est1RM;
          }
        }
      });
    }
  });

  if (maxWeight === 0) return null;
  return {
    exerciseName,
    maxWeight,
    repsAtMax,
    estimated1RM: max1RM,
    date: bestDate,
  };
}

export function getMuscleGroupDistribution(data: AppData): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!data.setLogs && !data.sets) return counts;

  // Count from setLogs
  if (data.setLogs) {
    Object.entries(data.setLogs).forEach(([key, logs]) => {
      const parts = key.split('-');
      if (parts.length < 5) return;
      const dayIndex = Number(parts[3]);
      const exerciseIndex = Number(parts[4]);
      const exercises = getExercisesForDay(data, dayIndex);
      const ex = exercises[exerciseIndex];
      if (ex) {
        const completed = logs.filter(l => l.completed).length;
        if (completed > 0) {
          counts[ex.muscle] = (counts[ex.muscle] || 0) + completed;
        }
      }
    });
  }

  return counts;
}

export function weeklySummary(data: AppData, reference: Date, offsetWeeks = -1): WeeklySummary {
  const days = PROGRAM.map((_, index) => {
    const date = weekDate(reference, index);
    date.setDate(date.getDate() + offsetWeeks * 7);
    const iso = dateKey(date);
    const exercises = getExercisesForDay(data, index);

    let sets = 0;
    exercises.forEach((_, exerciseIndex) => {
      const key = `${iso}-${index}-${exerciseIndex}`;
      if (data.setLogs && data.setLogs[key]) {
        sets += data.setLogs[key].filter(l => l.completed).length;
      } else {
        sets += Math.max(0, data.sets?.[key] || 0);
      }
    });

    const volume = calculateDayVolume(data, iso, index);

    return {
      iso,
      index,
      sets,
      volume,
      percent: progressFor(data, iso, index),
      status: workoutStatus(data, iso, index, reference),
    };
  });

  return {
    weekStart: days[0].iso,
    completed: days.filter(d => d.status === 'completed').length,
    partial: days.filter(d => d.status === 'partial').length,
    absent: days.filter(d => d.status === 'absent').length,
    totalSets: days.reduce((total, d) => total + d.sets, 0),
    totalVolume: days.reduce((total, d) => total + d.volume, 0),
    days,
  };
}

export function completedDates(data: AppData) {
  const dates = new Set<string>();
  if (data.setLogs) {
    Object.keys(data.setLogs).forEach(k => {
      const iso = k.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) dates.add(iso);
    });
  }
  if (data.sets) {
    Object.keys(data.sets).forEach(k => {
      const iso = k.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) dates.add(iso);
    });
  }
  return [...dates].filter(iso => progressFor(data, iso) >= 100).sort().reverse();
}

export function getStreak(data: AppData, today: Date) {
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let streak = 0;

  const todayIndex = (cursor.getDay() + 6) % 7;
  const todayExercises = getExercisesForDay(data, todayIndex);
  if (todayExercises.length && progressFor(data, dateKey(cursor), todayIndex) < 100) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (let count = 0; count < 370; count += 1) {
    const iso = dateKey(cursor);
    const index = dayIndexForISO(iso);
    const exercises = getExercisesForDay(data, index);

    if (!exercises.length) {
      // Rest day does not break streak
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (progressFor(data, iso, index) < 100) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getLifterRank(level: number): string {
  if (level <= 2) return 'Iron Novice';
  if (level <= 5) return 'Apprentice Lifter';
  if (level <= 9) return 'Consistent Athlete';
  if (level <= 14) return 'Iron Warrior';
  if (level <= 19) return 'Gym Beast';
  if (level <= 29) return 'Titan Lifter';
  return 'Iron Legend';
}

export function gamification(data: AppData, today: Date) {
  const dates = completedDates(data);

  let totalSets = 0;
  if (data.setLogs) {
    Object.values(data.setLogs).forEach(logs => {
      totalSets += logs.filter(l => l.completed).length;
    });
  }
  if (totalSets === 0 && data.sets) {
    totalSets = Object.values(data.sets).reduce((t, v) => t + Math.max(0, v), 0);
  }

  const totalVolume = calculateTotalVolume(data);
  const streak = getStreak(data, today);

  // Pure Gym XP Formula:
  // 150 XP per completed workout
  // 10 XP per logged set
  // 1 XP per 25 kg/lbs volume lifted
  // 50 XP per streak day
  const volumeXP = Math.floor(totalVolume / 25);
  const xp = dates.length * 150 + totalSets * 10 + volumeXP + streak * 50;
  const level = Math.floor(xp / 500) + 1;
  const levelProgress = (xp % 500) / 500;
  const rank = getLifterRank(level);

  return {
    xp,
    level,
    rank,
    levelProgress,
    streak,
    workouts: dates.length,
    totalSets,
    totalVolume,
    lastWorkout: dates[0] || '',
  };
}

export function formatLastWorkout(iso: string, data: AppData) {
  if (!iso) return 'No completed workout yet';
  const index = dayIndexForISO(iso);
  const date = new Date(`${iso}T12:00:00`);
  const day = PROGRAM[index];
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${day?.type || 'Workout'}`;
}

export function latestMeasurement(items: Measurement[]) {
  return items.length ? items[items.length - 1] : null;
}

export function startingMeasurement(items: Measurement[]) {
  return items.length ? items[0] : null;
}
