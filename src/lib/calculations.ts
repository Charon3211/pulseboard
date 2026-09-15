import { DERIVED_HABITS, PROGRAM } from './program';
import type { AppData, Measurement, WeeklySummary, WorkoutStatus } from './types';

export function pad(n: number) { return String(n).padStart(2, '0'); }
export function dateKey(date = new Date()) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; }
export function dayIndexForISO(iso: string) { const [year, month, day] = iso.split('-').map(Number); return (new Date(year, month - 1, day).getDay() + 6) % 7; }
export function weekDate(reference: Date, index: number) { const result = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate()); const todayIndex = (reference.getDay() + 6) % 7; result.setDate(result.getDate() - todayIndex + index); return result; }
export function selectedWorkoutDate(reference: Date, selectedDay: number) { return dateKey(weekDate(reference, selectedDay)); }

export function progressFor(data: AppData, iso: string, index = dayIndexForISO(iso)) {
  const day = PROGRAM[index];
  if (!day?.ex.length) return 0;
  const complete = day.ex.filter((exercise, exerciseIndex) => (data.sets[`${iso}-${index}-${exerciseIndex}`] || 0) >= exercise.sets).length;
  return Math.round((complete / day.ex.length) * 100);
}

export function workoutStatus(data: AppData, iso: string, index: number, reference = new Date()): WorkoutStatus {
  const day = PROGRAM[index];
  if (!day?.ex.length) return 'rest';
  const loggedSets = day.ex.reduce((total, exercise, exerciseIndex) => total + Math.max(0, data.sets[`${iso}-${index}-${exerciseIndex}`] || 0), 0);
  const percent = progressFor(data, iso, index);
  if (percent >= 100) return 'completed';
  if (loggedSets > 0) return 'partial';
  if (new Date(`${iso}T23:59:59`).getTime() > reference.getTime()) return 'upcoming';
  return 'absent';
}

export function habitIsComplete(data: AppData, habit: string, iso: string, index = dayIndexForISO(iso)) {
  if (habit === 'Sleep Hours' || habit === '8 Hours Sleep') return data.sleepHours >= 8;
  if (habit === 'Protein Target') return data.protein >= data.proteinTarget;
  if (habit === 'Workout Completed') return workoutStatus(data, iso, index) === 'completed';
  return Boolean(data.habits[`${iso}-${habit}`] ?? data.habits[`${iso}-${habit === 'Sleep Hours' ? '8 Hours Sleep' : habit}`]);
}

export function weeklySummary(data: AppData, reference: Date, offsetWeeks = -1): WeeklySummary {
  const days = PROGRAM.map((item, index) => {
    const date = weekDate(reference, index);
    date.setDate(date.getDate() + offsetWeeks * 7);
    const iso = dateKey(date);
    const sets = item.ex.reduce((total, exercise, exerciseIndex) => total + Math.max(0, data.sets[`${iso}-${index}-${exerciseIndex}`] || 0), 0);
    return { iso, index, sets, percent: progressFor(data, iso, index), status: workoutStatus(data, iso, index, reference) };
  });
  return {
    weekStart: days[0].iso,
    completed: days.filter(day => day.status === 'completed').length,
    partial: days.filter(day => day.status === 'partial').length,
    absent: days.filter(day => day.status === 'absent').length,
    totalSets: days.reduce((total, day) => total + day.sets, 0),
    habitChecks: Object.entries(data.habits).filter(([key, value]) => value && days.some(day => key.startsWith(`${day.iso}-`)) && ![...DERIVED_HABITS, '8 Hours Sleep'].some(habit => key.endsWith(`-${habit}`))).length,
    days,
  };
}

export function completedDates(data: AppData) {
  const dates = new Set(Object.keys(data.sets).map(key => key.slice(0, 10)).filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value)));
  return [...dates].filter(iso => progressFor(data, iso) >= 100).sort().reverse();
}

export function getStreak(data: AppData, today: Date) {
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let streak = 0;
  if (progressFor(data, dateKey(cursor), (cursor.getDay() + 6) % 7) < 100) cursor.setDate(cursor.getDate() - 1);
  for (let count = 0; count < 370; count += 1) {
    const iso = dateKey(cursor);
    const index = dayIndexForISO(iso);
    if (!PROGRAM[index].ex.length) { cursor.setDate(cursor.getDate() - 1); continue; }
    if (progressFor(data, iso, index) < 100) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function gamification(data: AppData, today: Date) {
  const dates = completedDates(data);
  const totalSets = Object.values(data.sets).reduce((total, value) => total + Math.max(0, value), 0);
  const manualHabitChecks = Object.entries(data.habits).filter(([key, value]) => value && !key.endsWith('-Workout Completed') && !key.endsWith('-Protein Target') && !key.endsWith('-8 Hours Sleep')).length;
  const todayISO = dateKey(today);
  const derivedHabitChecks = Number(habitIsComplete(data, 'Sleep Hours', todayISO)) + Number(habitIsComplete(data, 'Workout Completed', todayISO)) + Number(habitIsComplete(data, 'Protein Target', todayISO));
  const habitChecks = manualHabitChecks + derivedHabitChecks;
  const xp = dates.length * 100 + totalSets * 10 + habitChecks * 20;
  const level = Math.floor(xp / 500) + 1;
  return { xp, level, levelProgress: (xp % 500) / 500, streak: getStreak(data, today), workouts: dates.length, totalSets, habitChecks, lastWorkout: dates[0] || '' };
}

export function formatLastWorkout(iso: string) { if (!iso) return 'No completed workout yet'; const index = dayIndexForISO(iso); const date = new Date(`${iso}T12:00:00`); return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${PROGRAM[index].type}`; }
export function formatSleep(hours: number) { return hours ? `${hours.toFixed(hours % 1 ? 1 : 0)}h` : '—'; }
export function latestMeasurement(items: Measurement[]) { return items.length ? items[items.length - 1] : null; }
export function startingMeasurement(items: Measurement[]) { return items.length ? items[0] : null; }
