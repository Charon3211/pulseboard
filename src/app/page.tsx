'use client';

/* Profile photos are compressed local data URLs; next/image cannot optimize them usefully. */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAppData } from '../hooks/useAppData';
import { GYM_QUOTES, MUSCLE_GROUPS, NAV, PROGRAM, REST_PRESETS } from '../lib/program';
import {
  calculateDayVolume,
  calculateTotalVolume,
  completedDates,
  dateKey,
  dayIndexForISO,
  formatLastWorkout,
  gamification,
  getExercisesForDay,
  getMuscleGroupDistribution,
  getPersonalRecord,
  getPreviousPerformance,
  getSetLogs,
  latestMeasurement,
  progressFor,
  selectedWorkoutDate,
  startingMeasurement,
  weekDate,
  weeklySummary,
  workoutStatus,
} from '../lib/calculations';
import {
  formatSignedChange,
  formatVolume,
  parseNumericInput,
} from '../lib/validation';
import type {
  AppData,
  Exercise,
  Measurement,
  PersonalRecord,
  SetLog,
  Weather,
  WeatherStatus,
  WeeklySummary,
  WeightUnit,
} from '../lib/types';
import { Icon } from '../components/shared/Icon';
import type { IconName } from '../components/shared/Icon';
import { ProgressRing } from '../components/shared/ProgressRing';
import { RestTimer } from '../components/RestTimer';
import { ExerciseCard } from '../components/ExerciseCard';
import { AddExerciseModal } from '../components/AddExerciseModal';
import { playSetCompleteSound, playTimerFinishSound, playWorkoutCompleteSound } from '../lib/audio';

const AUTH = 'pulseboard:session';
const WEATHER_KEY = 'pulseboard:weather:v1';

type Achievement = { id: string; unlocked: boolean; title: string; copy: string; icon: IconName };

function weatherLabel(code: number) {
  if (code === 0) return 'Clear sky';
  if ([1, 2, 3].includes(code)) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Local conditions';
}

function weatherIcon(code: number) {
  if (code === 0) return '☀';
  if ([1, 2, 3].includes(code)) return '◌';
  if ([45, 48].includes(code)) return '≋';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '☂';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '✳';
  return '⁙';
}

function WeeklyGraph({ summary }: { summary: WeeklySummary }) {
  const max = Math.max(1, ...summary.days.map(d => d.sets));
  return (
    <div className="weekly-graph" role="img" aria-label="Previous week training volume graph">
      {summary.days.map(day => (
        <div className="graph-column" key={day.iso}>
          <div className="graph-bar-track">
            <i
              className={`graph-bar graph-${day.status}`}
              style={{ height: `${day.sets ? Math.max(8, (day.sets / max) * 100) : 4}%` }}
            />
          </div>
          <b>{day.sets}</b>
          <span>
            {new Date(`${day.iso}T12:00:00`).toLocaleDateString([], { weekday: 'short' }).slice(0, 3)}
          </span>
        </div>
      ))}
    </div>
  );
}

function WeeklyReviewCard({ summary, onNotify }: { summary: WeeklySummary; onNotify: () => void }) {
  return (
    <section className="card weekly-review">
      <div className="section-head">
        <div className="heading-with-icon">
          <Icon name="stats" />
          <h2>Last week in review</h2>
        </div>
        <span className="mono muted">
          {new Date(`${summary.weekStart}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' })} →
        </span>
      </div>
      <div className="review-headline">
        <strong>{summary.completed} workouts completed.</strong>
        <span>
          {summary.absent ? `${summary.absent} missed` : 'Full consistency'} · {summary.totalSets} sets logged
        </span>
      </div>
      <WeeklyGraph summary={summary} />
      <div className="review-stats">
        <div>
          <b>{summary.completed}</b>
          <span>finished</span>
        </div>
        <div>
          <b>{summary.partial}</b>
          <span>partial</span>
        </div>
        <div>
          <b>{summary.absent}</b>
          <span>missed</span>
        </div>
        <div>
          <b>{summary.totalSets}</b>
          <span>total sets</span>
        </div>
      </div>
      <button className="button secondary" style={{ marginTop: '16px' }} onClick={onNotify}>
        <Icon name="bell" size={15} /> Enable weekly summary alerts
      </button>
    </section>
  );
}

function MeasurementTrend({ items, unit }: { items: Measurement[]; unit: string }) {
  if (!items.length) return <div className="trend-empty">Add a measurement to start your trend.</div>;
  const width = 320;
  const height = 90;
  const values = items.map(item => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = items
    .map(
      (item, index) =>
        `${10 + (index * (width - 20)) / Math.max(1, items.length - 1)},${
          height - 12 - ((item.value - min) / span) * (height - 28)
        }`
    )
    .join(' ');

  return (
    <div className="measurement-trend">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${unit} measurement trend`}>
        <path className="trend-grid" d={`M10 ${height - 12}H${width - 10}M10 ${height / 2}H${width - 10}M10 12H${width - 10}`} />
        <polyline className="trend-line" points={points} />
        {items.map((item, index) => {
          const pair = points.split(' ')[index];
          if (!pair) return null;
          const [x, y] = pair.split(',');
          return <circle key={`${item.date}-${index}`} className="trend-dot" cx={x} cy={y} r="3" />;
        })}
      </svg>
      <div className="trend-labels">
        <span>
          {items[0].value} {unit}
        </span>
        <span>
          {items[items.length - 1].value} {unit}
        </span>
      </div>
    </div>
  );
}

async function optimizeImage(file: File) {
  const source = await createImageBitmap(file);
  const max = 420;
  const scale = Math.min(1, max / Math.max(source.width, source.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}

function useCountUp(value: number, duration = 200) {
  const [displayed, setDisplayed] = useState(value);
  const displayedRef = useRef(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (displayedRef.current === value) return;
    if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    const start = displayedRef.current;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      frame.current = window.requestAnimationFrame(() => {
        displayedRef.current = value;
        setDisplayed(value);
        frame.current = null;
      });
      return () => {
        if (frame.current !== null) window.cancelAnimationFrame(frame.current);
        frame.current = null;
      };
    }
    const startedAt = performance.now();
    const tick = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - startedAt) / duration);
      const next = Math.round(start + (value - start) * progress);
      displayedRef.current = next;
      setDisplayed(next);
      if (progress < 1) frame.current = window.requestAnimationFrame(tick);
      else frame.current = null;
    };
    frame.current = window.requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, [value, duration]);

  return displayed;
}

export default function Page() {
  const { data, ready, updateData, resetData, exportJson, importJson } = useAppData();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [bad, setBad] = useState(false);
  const [day, setDay] = useState((new Date().getDay() + 6) % 7);
  const [tab, setTab] = useState('home');
  const [clockNow, setClockNow] = useState(new Date());
  const [calculationNow, setCalculationNow] = useState(new Date());
  const [offline, setOffline] = useState(false);
  const [toast, setToast] = useState('');
  const [levelUp, setLevelUp] = useState<number | null>(null);

  // Weather state
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>('idle');

  // Body measurements draft
  const [measurementDate, setMeasurementDate] = useState(dateKey());
  const [weightDraft, setWeightDraft] = useState('');
  const [waistDraft, setWaistDraft] = useState('');

  // Exercise explorer state
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>('All');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Rest Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTotal, setTimerTotal] = useState(0);

  // Theme synchronization
  useEffect(() => {
    document.documentElement.dataset.theme = data.theme;
  }, [data.theme]);

  // Initial hydration and clock
  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      try {
        const cached = localStorage.getItem(WEATHER_KEY);
        if (cached) setWeather(JSON.parse(cached));
        const authStatus = sessionStorage.getItem(AUTH);
        // If passcode is empty or already authenticated
        if (!data.passcode || authStatus === 'ok') {
          setAuthed(true);
        }
      } catch {
        // Recover cleanly
      }
      setOffline(!navigator.onLine);
    }, 0);

    const timer = window.setInterval(() => {
      const current = new Date();
      setClockNow(current);
      setCalculationNow(prev => (dateKey(prev) === dateKey(current) ? prev : current));
    }, 1000);

    const online = () => {
      setOffline(false);
      setWeatherStatus(s => (s === 'offline' ? 'idle' : s));
    };
    const off = () => {
      setOffline(true);
      setWeatherStatus('offline');
    };

    window.addEventListener('online', online);
    window.addEventListener('offline', off);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => undefined);
    }

    return () => {
      window.clearTimeout(hydrate);
      window.clearInterval(timer);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', off);
    };
  }, [data.passcode]);

  // Rest timer countdown interval
  useEffect(() => {
    if (!timerActive) return;
    const interval = window.setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setTimerActive(false);
          playTimerFinishSound(data.soundEnabled);
          setToast('⚡ Rest time complete! Time for the next set.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerActive, data.soundEnabled]);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(curr => (curr === message ? '' : curr)), 2200);
  }, []);

  const todayIndex = (calculationNow.getDay() + 6) % 7;
  const selectedDate = selectedWorkoutDate(calculationNow, day);
  const todayDate = selectedWorkoutDate(calculationNow, todayIndex);

  const selectedExercises = useMemo(() => getExercisesForDay(data, day), [data, day]);
  const todayExercises = useMemo(() => getExercisesForDay(data, todayIndex), [data, todayIndex]);

  const selectedDayProgram = PROGRAM[day];
  const todayDayProgram = PROGRAM[todayIndex];

  const selectedProgress = progressFor(data, selectedDate, day);
  const todayProgress = progressFor(data, todayDate, todayIndex);

  const todayVolume = calculateDayVolume(data, todayDate, todayIndex);
  const game = useMemo(() => gamification(data, calculationNow), [data, calculationNow]);
  const summary = useMemo(() => weeklySummary(data, calculationNow), [data, calculationNow]);
  const summaryWindow = calculationNow.getDay() === 1;

  const quote = GYM_QUOTES[Math.abs(Math.floor(new Date(`${dateKey(calculationNow)}T12:00:00`).getTime() / 86400000)) % GYM_QUOTES.length];

  const currentWeight = latestMeasurement(data.bodyMeasurements.weight);
  const startingWeight = startingMeasurement(data.bodyMeasurements.weight);
  const currentWaist = latestMeasurement(data.bodyMeasurements.waist);
  const startingWaist = startingMeasurement(data.bodyMeasurements.waist);

  // Animated counters
  const displayedLevel = useCountUp(game.level);
  const displayedStreak = useCountUp(game.streak);
  const displayedWorkouts = useCountUp(game.workouts);
  const displayedSets = useCountUp(game.totalSets);

  // Achievements
  const achievements = useMemo<Achievement[]>(
    () => [
      { id: 'first-blood', unlocked: game.workouts >= 1, title: 'First Session', copy: 'Complete 1 full workout', icon: 'workout' },
      { id: 'showing-up', unlocked: game.workouts >= 3, title: 'Showing Up', copy: 'Complete 3 full workouts', icon: 'flame' },
      { id: 'iron-streak', unlocked: game.streak >= 7, title: 'Iron Streak', copy: 'Build a 7-day consistency streak', icon: 'spark' },
      { id: 'centurion', unlocked: game.totalSets >= 100, title: 'The Centurion', copy: 'Log 100 total sets', icon: 'stats' },
      { id: 'ton-club', unlocked: game.totalVolume >= 5000, title: 'Ton Club', copy: 'Lift over 5,000 kg volume', icon: 'trophy' },
      { id: 'heavy-duty', unlocked: game.workouts >= 10, title: 'Heavy Duty', copy: 'Complete 10 full workouts', icon: 'award' },
    ],
    [game.workouts, game.streak, game.totalSets, game.totalVolume]
  );

  // Level up detection
  const previousLevel = useRef<number | null>(null);
  useEffect(() => {
    if (!ready || !authed) return;
    if (previousLevel.current === null) {
      previousLevel.current = game.level;
      return;
    }
    if (game.level > previousLevel.current) {
      setLevelUp(game.level);
      notify(`LEVEL UP! → LVL ${game.level} · ${game.rank}`);
      window.setTimeout(() => setLevelUp(null), 1000);
    }
    previousLevel.current = game.level;
  }, [game.level, game.rank, ready, authed, notify]);

  // Auth unlock
  function unlock(event: FormEvent) {
    event.preventDefault();
    if (password === (data.passcode || 'coco1513')) {
      sessionStorage.setItem(AUTH, 'ok');
      setAuthed(true);
    } else {
      setBad(true);
      window.setTimeout(() => setBad(false), 500);
    }
  }

  // Rest Timer controls
  function startRestTimer(duration = data.defaultRestSeconds) {
    setTimerTotal(duration);
    setTimerSeconds(duration);
    setTimerActive(true);
  }

  function toggleRestTimer() {
    setTimerActive(prev => !prev);
  }

  function resetRestTimer() {
    setTimerSeconds(timerTotal || data.defaultRestSeconds);
    setTimerActive(true);
  }

  function add30Seconds() {
    setTimerSeconds(prev => prev + 30);
    setTimerTotal(prev => prev + 30);
  }

  function closeRestTimer() {
    setTimerActive(false);
    setTimerSeconds(0);
    setTimerTotal(0);
  }

  // Workout Set Logging Handlers
  function handleUpdateSet(exerciseIndex: number, setIndex: number, patch: Partial<SetLog>) {
    const key = `${selectedDate}-${day}-${exerciseIndex}`;
    const ex = selectedExercises[exerciseIndex];
    const currentLogs = getSetLogs(data, selectedDate, day, exerciseIndex, ex?.sets || 3);
    const updated = currentLogs.map((item, idx) => (idx === setIndex ? { ...item, ...patch } : item));

    const completedCount = updated.filter(s => s.completed).length;

    updateData({
      setLogs: { ...data.setLogs, [key]: updated },
      sets: { ...data.sets, [key]: completedCount },
    });
  }

  function handleToggleSet(exerciseIndex: number, setIndex: number) {
    const key = `${selectedDate}-${day}-${exerciseIndex}`;
    const ex = selectedExercises[exerciseIndex];
    const currentLogs = getSetLogs(data, selectedDate, day, exerciseIndex, ex?.sets || 3);
    const currentSet = currentLogs[setIndex];
    const nextCompleted = !currentSet?.completed;

    const updated = currentLogs.map((item, idx) =>
      idx === setIndex ? { ...item, completed: nextCompleted } : item
    );

    const completedCount = updated.filter(s => s.completed).length;

    updateData({
      setLogs: { ...data.setLogs, [key]: updated },
      sets: { ...data.sets, [key]: completedCount },
    });

    if (nextCompleted) {
      playSetCompleteSound(data.soundEnabled);
      // Auto-start rest timer if not already running
      if (!timerActive || timerSeconds === 0) {
        startRestTimer(data.defaultRestSeconds);
      }

      // Check if all exercises on this day are now finished
      const allExercisesDone = selectedExercises.every((e, idx) => {
        if (idx === exerciseIndex) return completedCount >= e.sets;
        const otherLogs = getSetLogs(data, selectedDate, day, idx, e.sets);
        return otherLogs.filter(s => s.completed).length >= e.sets;
      });

      if (allExercisesDone) {
        playWorkoutCompleteSound(data.soundEnabled);
        notify('🏆 Session completed! All exercises in the books.');
      } else {
        notify('Set saved');
      }
    }
  }

  function handleAddSet(exerciseIndex: number) {
    const key = `${selectedDate}-${day}-${exerciseIndex}`;
    const ex = selectedExercises[exerciseIndex];
    const currentLogs = getSetLogs(data, selectedDate, day, exerciseIndex, ex?.sets || 3);
    const last = currentLogs[currentLogs.length - 1];

    const nextSet: SetLog = {
      setNumber: currentLogs.length + 1,
      weight: last?.weight || 0,
      reps: last?.reps || 10,
      completed: false,
    };

    const updated = [...currentLogs, nextSet];
    updateData({
      setLogs: { ...data.setLogs, [key]: updated },
    });
    notify('Added set');
  }

  function handleRemoveSet(exerciseIndex: number) {
    const key = `${selectedDate}-${day}-${exerciseIndex}`;
    const ex = selectedExercises[exerciseIndex];
    const currentLogs = getSetLogs(data, selectedDate, day, exerciseIndex, ex?.sets || 3);
    if (currentLogs.length <= 1) return;

    const updated = currentLogs.slice(0, -1);
    const completedCount = updated.filter(s => s.completed).length;

    updateData({
      setLogs: { ...data.setLogs, [key]: updated },
      sets: { ...data.sets, [key]: completedCount },
    });
    notify('Removed set');
  }

  function handleSaveExerciseNote(exerciseName: string, note: string) {
    updateData({
      exerciseNotes: { ...data.exerciseNotes, [exerciseName]: note },
    });
  }

  function handleAddCustomExercise(dayIndex: number, newExercise: Exercise) {
    const existing = getExercisesForDay(data, dayIndex);
    const updated = [...existing, newExercise];
    updateData({
      customDays: { ...data.customDays, [dayIndex]: updated },
    });
    notify(`Added ${newExercise.name} to ${PROGRAM[dayIndex].long}`);
  }

  // Measurements
  function addMeasurement(kind: 'weight' | 'waist', raw: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(measurementDate)) {
      notify('Choose a valid measurement date');
      return;
    }
    const parsed = parseNumericInput(raw, kind);
    if (parsed === null) {
      notify(`Enter a valid ${kind} number`);
      return;
    }
    const next: Measurement = { date: measurementDate, value: parsed };
    const items = [...data.bodyMeasurements[kind].filter(item => item.date !== measurementDate), next].sort(
      (a, b) => a.date.localeCompare(b.date)
    );
    updateData({ bodyMeasurements: { ...data.bodyMeasurements, [kind]: items } });
    if (kind === 'weight') setWeightDraft('');
    else setWaistDraft('');
    notify(`${kind === 'weight' ? 'Body weight' : 'Waist'} measurement saved`);
  }

  function removeMeasurement(kind: 'weight' | 'waist', date: string) {
    updateData({
      bodyMeasurements: {
        ...data.bodyMeasurements,
        [kind]: data.bodyMeasurements[kind].filter(item => item.date !== date),
      },
    });
    notify('Measurement removed');
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      updateData({ profilePhoto: await optimizeImage(file) });
      notify('Profile photo updated');
    } catch {
      notify('Unable to save image');
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!confirm('Importing will replace your current local data. Continue?')) return;
    const result = await importJson(file);
    notify(result.ok ? 'Backup restored successfully' : result.error);
  }

  async function loadWeather() {
    if (!navigator.onLine) {
      setWeatherStatus('offline');
      notify('Offline: showing saved conditions');
      return;
    }
    if (!navigator.geolocation) {
      setWeatherStatus('denied');
      notify('Location not supported in browser');
      return;
    }
    setWeatherStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          setWeatherStatus('loading');
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`
          );
          if (!response.ok) throw new Error('Weather request failed');
          const result = await response.json();
          const next: Weather = {
            temperature: Math.round(result.current.temperature_2m),
            apparent: Math.round(result.current.apparent_temperature),
            wind: Math.round(result.current.wind_speed_10m),
            code: result.current.weather_code,
            fetchedAt: Date.now(),
          };
          setWeather(next);
          setWeatherStatus('ready');
          try {
            localStorage.setItem(WEATHER_KEY, JSON.stringify(next));
          } catch {
            /* optional */
          }
          notify('Local conditions updated');
        } catch {
          setWeatherStatus(weather ? 'ready' : 'error');
          notify(weather ? 'Showing saved weather' : 'Weather request failed');
        }
      },
      () => {
        setWeatherStatus('denied');
        notify('Allow location to see local weather');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 900000 }
    );
  }

  async function enableWeeklyNotifications() {
    if (!('Notification' in window)) {
      notify('Native notifications not supported');
      return;
    }
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification("Hasan's Gym OS", {
        body: `${summary.completed} workouts · ${summary.totalSets} sets · ${formatVolume(summary.totalVolume, data.weightUnit)}`,
      });
      notify('Weekly alerts enabled');
    } else {
      notify('Notification permission not granted');
    }
  }

  // All unique exercises across all days for the Exercise Explorer tab
  const allExercises = useMemo(() => {
    const map = new Map<string, Exercise>();
    PROGRAM.forEach((_, idx) => {
      const exs = getExercisesForDay(data, idx);
      exs.forEach(e => {
        if (!map.has(e.name.toLowerCase())) {
          map.set(e.name.toLowerCase(), e);
        }
      });
    });
    return Array.from(map.values());
  }, [data]);

  const filteredExercises = useMemo(() => {
    return allExercises.filter(ex => {
      const matchesMuscle = selectedMuscleFilter === 'All' || ex.muscle.toLowerCase() === selectedMuscleFilter.toLowerCase();
      const matchesSearch = !exerciseSearch.trim() || ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) || ex.equipment.toLowerCase().includes(exerciseSearch.toLowerCase());
      return matchesMuscle && matchesSearch;
    });
  }, [allExercises, selectedMuscleFilter, exerciseSearch]);

  const muscleStats = useMemo(() => getMuscleGroupDistribution(data), [data]);

  if (!ready) {
    return (
      <div className="drawer" role="status" aria-live="polite">
        <div className="modal" style={{ textAlign: 'center', padding: '24px 28px' }}>
          <div className="brand">
            <i className="brand-dot" />
            HASAN&apos;S GYM OS
          </div>
          <p className="mono muted" style={{ margin: '16px 0 0' }}>
            Loading your gym journal…
          </p>
        </div>
      </div>
    );
  }

  // Password Lock Gate
  if (!authed && data.passcode) {
    return (
      <div className="drawer">
        <form className={`modal ${bad ? 'shake' : ''}`} onSubmit={unlock}>
          <div className="brand">
            <i className="brand-dot" />
            HASAN&apos;S GYM OS
          </div>
          <h2>Unlock your training space.</h2>
          <p className="muted">Your lifts, records, and journal are private and stored offline.</p>
          <div className="field">
            <label htmlFor="password">Access passcode</label>
            <input
              autoFocus
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter passcode"
            />
          </div>
          {bad && <p className="error-copy">Invalid code. Please try again.</p>}
          <button type="submit" className="button" style={{ width: '100%', marginTop: 12 }}>
            Unlock Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <i className="brand-dot" />
            HASAN&apos;S GYM <span className="brand-mark">/ OS</span>
          </div>
          <div className={`online mono ${offline ? 'offline' : ''}`}>
            <i />
            {offline ? 'OFFLINE' : 'LOCAL GYM MODE'}
          </div>
        </header>

        <main className={`view ${tab === 'home' ? 'home-view' : ''}`} key={tab}>
          {/* TAB 1: HOME / DASHBOARD */}
          {tab === 'home' && (
            <>
              <section className="hero">
                <div>
                  <div className="eyebrow">ELITE BODYBUILDING & TRAINING OS</div>
                  <h1>
                    {data.name.toUpperCase()}&apos;S GYM.
                  </h1>
                  <p>
                    {quote} <em>Today&apos;s focus: {todayDayProgram.type}.</em>
                  </p>
                </div>
                <div className="time-block">
                  <div className="time-label">
                    <Icon name="clock" size={12} /> GYM CLOCK <span className="live-dot" /> LIVE
                  </div>
                  <div className="clock">
                    {clockNow.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                  </div>
                  <div className="date">
                    {clockNow.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </section>

              {/* Today's Briefing Hero Card */}
              <div className="today-briefing-card">
                <div className="briefing-top">
                  <span className="briefing-tag">TODAY&apos;S SCHEDULED WORKOUT</span>
                  <span className="mono" style={{ color: 'var(--muted)', fontSize: '10px' }}>
                    {todayProgress}% COMPLETE
                  </span>
                </div>
                <div className="briefing-main">
                  <div>
                    <h2 className="briefing-title">{todayDayProgram.type.toUpperCase()}</h2>
                    <div className="briefing-focus">{todayDayProgram.focus}</div>
                  </div>
                  <button
                    type="button"
                    className="briefing-cta"
                    onClick={() => {
                      setDay(todayIndex);
                      setTab('workout');
                    }}
                  >
                    <span>{todayProgress > 0 && todayProgress < 100 ? 'Resume Workout' : todayProgress === 100 ? 'Review Workout' : 'Start Workout'}</span>
                    <Icon name="dumbbell" size={16} />
                  </button>
                </div>
              </div>

              <div className="dashboard-grid">
                {/* Today's Signal Card */}
                <section className="card">
                  <div className="section-head">
                    <div className="heading-with-icon">
                      <Icon name="spark" />
                      <h2>Today&apos;s Session</h2>
                    </div>
                    <span className="mono muted">{todayProgress}% finished</span>
                  </div>

                  <div className="signal-layout">
                    <ProgressRing value={todayProgress} label="today" />
                    <div className="metrics">
                      <div className="metric">
                        <Icon name="dumbbell" size={15} />
                        <strong>
                          {todayExercises.length
                            ? `${todayExercises.filter((_, i) => (data.sets[`${todayDate}-${todayIndex}-${i}`] || 0) >= todayExercises[i].sets).length}/${todayExercises.length}`
                            : '0'}
                        </strong>
                        <span>Exercises done</span>
                      </div>
                      <div className="metric">
                        <Icon name="stats" size={15} />
                        <strong>{todayVolume > 0 ? formatVolume(todayVolume, data.weightUnit) : '0'}</strong>
                        <span>Volume lifted</span>
                      </div>
                      <div className="metric">
                        <Icon name="flame" size={15} />
                        <strong>{game.streak}d</strong>
                        <span>Day streak</span>
                      </div>
                    </div>
                  </div>

                  <div className="bar">
                    <i style={{ width: `${todayProgress}%` }} />
                  </div>
                </section>

                {/* Momentum & Lifter Rank Card */}
                <section className="card momentum-card">
                  <div className="section-head">
                    <div className="heading-with-icon">
                      <Icon name="flame" />
                      <h2>Lifter Momentum</h2>
                    </div>
                    <span className="level-badge">{game.rank}</span>
                  </div>
                  <div className="momentum-main">
                    <div>
                      <strong className={`level-number ${levelUp === game.level ? 'level-up' : ''}`}>
                        {displayedLevel}
                      </strong>
                      <span className="mono muted">LIFTER LEVEL</span>
                    </div>
                    <div className="streak-display">
                      <Icon name="flame" size={26} />
                      <strong>{displayedStreak}</strong>
                      <span>day streak</span>
                    </div>
                  </div>
                  <div className="level-track">
                    <i style={{ width: `${Math.round(game.levelProgress * 100)}%` }} />
                  </div>
                  <div className="level-meta">
                    <span>{game.xp % 500} / 500 XP</span>
                    <span>{game.workouts} workouts completed</span>
                  </div>
                </section>

                {/* Last Workout Summary */}
                <section className="card">
                  <div className="section-head">
                    <div className="heading-with-icon">
                      <Icon name="clock" />
                      <h2>Last Completed Session</h2>
                    </div>
                    <button type="button" className="text-button" onClick={() => setTab('workout')}>
                      Open Journal →
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        border: '1.5px solid var(--ink)',
                        display: 'grid',
                        placeItems: 'center',
                        flex: 'none',
                      }}
                    >
                      <Icon name="check" size={20} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '16px' }}>{formatLastWorkout(game.lastWorkout, data)}</strong>
                      <p className="small muted" style={{ margin: '4px 0 0', fontSize: '11px' }}>
                        {game.lastWorkout ? 'Logged and stored locally on this device' : 'Ready for your first session today!'}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Weather Window */}
                <section className="card">
                  <div className="section-head">
                    <div className="heading-with-icon">
                      <Icon name="cloud" />
                      <h2>Weather Window</h2>
                    </div>
                    <span className="mono muted">
                      {weatherStatus === 'ready' ? 'UPDATED' : weather ? 'CACHED' : 'LOCAL'}
                    </span>
                  </div>
                  {weather ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '60px' }}>
                      <div style={{ fontSize: '38px', lineHeight: 1 }} aria-hidden="true">
                        {weatherIcon(weather.code)}
                      </div>
                      <div>
                        <strong style={{ fontSize: '32px', letterSpacing: '-0.05em' }}>{weather.temperature}°</strong>
                        <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>
                          {weatherLabel(weather.code)}
                        </div>
                        <div className="mono muted" style={{ fontSize: '10px', marginTop: '4px' }}>
                          Feels {weather.apparent}° · Wind {weather.wind} mph
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                      Track outside conditions for walks & cardio.
                    </div>
                  )}
                  <button
                    type="button"
                    className="button secondary"
                    style={{ marginTop: '14px', width: '100%' }}
                    onClick={loadWeather}
                    disabled={weatherStatus === 'locating' || weatherStatus === 'loading'}
                  >
                    {weatherStatus === 'locating'
                      ? 'Finding location…'
                      : weatherStatus === 'loading'
                      ? 'Updating weather…'
                      : weather
                      ? 'Refresh Weather'
                      : 'Enable Local Weather'}
                  </button>
                </section>
              </div>

              {summaryWindow && <WeeklyReviewCard summary={summary} onNotify={enableWeeklyNotifications} />}
            </>
          )}

          {/* TAB 2: WORKOUT / ACTIVE LOGGER */}
          {tab === 'workout' && (
            <>
              {/* Day Selection Rail */}
              <nav className="day-rail" aria-label="Workout days rail">
                {PROGRAM.map((item, index) => {
                  const date = weekDate(calculationNow, index);
                  const iso = dateKey(date);
                  const isToday = index === todayIndex;
                  const percent = progressFor(data, iso, index);
                  const status = workoutStatus(data, iso, index, calculationNow);
                  return (
                    <button
                      key={item.dow}
                      type="button"
                      className={`day-card ${day === index ? 'active' : ''} ${isToday ? 'today' : ''} status-${status}`}
                      onClick={() => setDay(index)}
                    >
                      <span className="day-card-top">
                        <b>{item.dow}</b>
                        {isToday && <i>TODAY</i>}
                      </span>
                      <strong>{date.getDate()}</strong>
                      <small>{date.toLocaleDateString([], { month: 'short' })}</small>
                      <span className="day-card-progress">
                        {status === 'completed'
                          ? '100% DONE'
                          : status === 'partial'
                          ? `${percent}% ACTIVE`
                          : status.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Workout Session Card */}
              <section className="card workout-card">
                <div className="workout-header-row">
                  <div>
                    <div className="eyebrow">
                      {selectedDayProgram.long.toUpperCase()} ·{' '}
                      {weekDate(calculationNow, day).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      {day === todayIndex && ' · TODAY'}
                    </div>
                    <h1 style={{ margin: '6px 0 0', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900 }}>
                      {selectedDayProgram.type.toUpperCase()}
                    </h1>
                    <div className="workout-meta-badges">
                      <span className="badge muscle">{selectedDayProgram.focus}</span>
                      <span className="badge">
                        {selectedExercises.length} {selectedExercises.length === 1 ? 'Exercise' : 'Exercises'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <ProgressRing value={selectedProgress} label="session" />
                    <button
                      type="button"
                      className="button secondary"
                      style={{ padding: '6px 10px', fontSize: '10px' }}
                      onClick={() => setShowAddModal(true)}
                    >
                      <Icon name="plus" size={13} /> Add Exercise
                    </button>
                  </div>
                </div>

                {/* Exercises List */}
                {selectedExercises.length > 0 ? (
                  <div className="workout-list">
                    {selectedExercises.map((exercise, exIdx) => {
                      const logs = getSetLogs(data, selectedDate, day, exIdx, exercise.sets);
                      const prevPerf = getPreviousPerformance(data, exercise.name, selectedDate);
                      const pr = getPersonalRecord(data, exercise.name);
                      const savedNote = data.exerciseNotes?.[exercise.name] || exercise.notes || '';

                      return (
                        <ExerciseCard
                          key={`${exercise.name}-${exIdx}`}
                          exercise={exercise}
                          exerciseIndex={exIdx}
                          setLogs={logs}
                          weightUnit={data.weightUnit}
                          previousPerformance={prevPerf}
                          personalRecord={pr}
                          savedNote={savedNote}
                          onUpdateSet={(sIdx, patch) => handleUpdateSet(exIdx, sIdx, patch)}
                          onToggleSet={sIdx => handleToggleSet(exIdx, sIdx)}
                          onAddSet={() => handleAddSet(exIdx)}
                          onRemoveSet={() => handleRemoveSet(exIdx)}
                          onSaveNote={note => handleSaveExerciseNote(exercise.name, note)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                    <Icon name="moon" size={40} />
                    <div className="eyebrow" style={{ marginTop: '16px' }}>
                      Recovery Protocol
                    </div>
                    <h2 style={{ fontSize: '32px', margin: '8px 0' }}>Rest & Mobility Day</h2>
                    <p className="muted" style={{ maxWidth: '420px', margin: 'auto' }}>
                      Muscle tissue grows and repairs while resting. Sleep well, maintain hydration, and prepare for the next training session.
                    </p>
                    <button
                      type="button"
                      className="button secondary"
                      style={{ marginTop: '20px' }}
                      onClick={() => setShowAddModal(true)}
                    >
                      <Icon name="plus" size={14} /> Add Workout To This Day
                    </button>
                  </div>
                )}
              </section>

              {/* Floating Rest Timer */}
              {(timerActive || timerSeconds > 0) && (
                <RestTimer
                  secondsLeft={timerSeconds}
                  totalSeconds={timerTotal}
                  isActive={timerActive}
                  onToggle={toggleRestTimer}
                  onReset={resetRestTimer}
                  onAdd30={add30Seconds}
                  onClose={closeRestTimer}
                />
              )}
            </>
          )}

          {/* TAB 3: EXERCISES / SPLIT EXPLORER */}
          {tab === 'exercises' && (
            <>
              <div className="hero">
                <div>
                  <div className="eyebrow">EXERCISE LIBRARY & SPLIT</div>
                  <h1>EXERCISES.</h1>
                  <p>Browse movements by muscle group, inspect personal records, and configure your split.</p>
                </div>
                <button
                  type="button"
                  className="button"
                  onClick={() => setShowAddModal(true)}
                >
                  <Icon name="plus" size={15} /> Add Custom Exercise
                </button>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
                {['All', ...MUSCLE_GROUPS].map(m => (
                  <button
                    key={m}
                    type="button"
                    className={`button secondary ${selectedMuscleFilter === m ? 'active' : ''}`}
                    style={{
                      padding: '8px 14px',
                      fontSize: '10px',
                      background: selectedMuscleFilter === m ? 'var(--ink)' : 'transparent',
                      color: selectedMuscleFilter === m ? 'var(--surface)' : 'var(--ink)',
                      borderColor: selectedMuscleFilter === m ? 'var(--ink)' : 'var(--line)',
                    }}
                    onClick={() => setSelectedMuscleFilter(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div style={{ marginBottom: '18px' }}>
                <input
                  type="text"
                  placeholder="Search exercises by name or equipment…"
                  value={exerciseSearch}
                  onChange={e => setExerciseSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--line)',
                    background: 'var(--surface)',
                    color: 'var(--ink)',
                  }}
                />
              </div>

              {/* Exercise Grid */}
              <div className="pr-grid">
                {filteredExercises.map(ex => {
                  const pr = getPersonalRecord(data, ex.name);
                  const note = data.exerciseNotes?.[ex.name] || ex.notes;
                  return (
                    <article className="pr-card" key={ex.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div className="pr-title">{ex.name}</div>
                          <div className="mono muted" style={{ fontSize: '10px', marginTop: '3px' }}>
                            {ex.muscle} · {ex.equipment}
                          </div>
                        </div>
                        <span className="badge muscle">{ex.sets} × {ex.reps}</span>
                      </div>

                      <div className="pr-stat">
                        <div>
                          <span className="mono muted" style={{ fontSize: '9px' }}>PERSONAL RECORD</span>
                          <div className="pr-weight">
                            {pr ? `${pr.maxWeight} ${data.weightUnit}` : '—'}
                          </div>
                        </div>
                        {pr && (
                          <div className="pr-1rm">
                            Est 1RM: <b>{pr.estimated1RM} {data.weightUnit}</b>
                          </div>
                        )}
                      </div>

                      {note && (
                        <div style={{ fontStyle: 'italic', fontSize: '11px', color: 'var(--muted)', marginTop: '6px', borderTop: '1px dashed var(--line)', paddingTop: '6px' }}>
                          “{note}”
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {/* TAB 4: ANALYTICS & STATS */}
          {tab === 'stats' && (
            <>
              <div className="hero">
                <div>
                  <div className="eyebrow">GYM PERFORMANCE ANALYTICS</div>
                  <h1>ANALYTICS.</h1>
                  <p>Track your volume load, sets distribution, progressive overload, and body composition.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="eyebrow">ALL-TIME VOLUME</div>
                  <strong style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', letterSpacing: '-0.06em' }}>
                    {formatVolume(game.totalVolume, data.weightUnit)}
                  </strong>
                </div>
              </div>

              {/* Stats Overview Grid */}
              <div className="dashboard-grid">
                {/* Lifter Stats */}
                <section className="card">
                  <div className="section-head">
                    <div className="heading-with-icon">
                      <Icon name="stats" />
                      <h2>Training Log Highlights</h2>
                    </div>
                    <span className="level-badge">{game.rank}</span>
                  </div>
                  <div className="metrics" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="metric">
                      <Icon name="dumbbell" size={16} />
                      <strong>{displayedWorkouts}</strong>
                      <span>Workouts</span>
                    </div>
                    <div className="metric">
                      <Icon name="stats" size={16} />
                      <strong>{displayedSets}</strong>
                      <span>Sets logged</span>
                    </div>
                    <div className="metric">
                      <Icon name="flame" size={16} />
                      <strong>{displayedStreak}d</strong>
                      <span>Active streak</span>
                    </div>
                    <div className="metric">
                      <Icon name="trophy" size={16} />
                      <strong>LVL {displayedLevel}</strong>
                      <span>Lifter level</span>
                    </div>
                  </div>

                  {/* Level progress */}
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', font: '10px var(--mono)' }}>
                      <span>LEVEL PROGRESSION</span>
                      <b>{game.xp % 500} / 500 XP</b>
                    </div>
                    <div className="bar">
                      <i style={{ width: `${Math.round(game.levelProgress * 100)}%` }} />
                    </div>
                  </div>
                </section>

                {/* Muscle Group Distribution */}
                <section className="card">
                  <div className="section-head">
                    <div className="heading-with-icon">
                      <Icon name="dumbbell" />
                      <h2>Volume by Muscle</h2>
                    </div>
                    <span className="mono muted">COMPLETED SETS</span>
                  </div>
                  <div className="muscle-list">
                    {MUSCLE_GROUPS.map(muscle => {
                      const count = muscleStats[muscle] || 0;
                      const maxSets = Math.max(1, ...Object.values(muscleStats));
                      const pct = Math.round((count / maxSets) * 100);
                      return (
                        <div className="muscle-row" key={muscle}>
                          <span className="muscle-name">{muscle}</span>
                          <div className="muscle-bar-wrap">
                            <div className="muscle-bar" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="muscle-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* Achievements */}
              <section className="card" style={{ marginTop: '16px' }}>
                <div className="section-head">
                  <div className="heading-with-icon">
                    <Icon name="trophy" />
                    <h2>Lifter Achievements</h2>
                  </div>
                  <span className="mono muted">
                    {achievements.filter(a => a.unlocked).length} / {achievements.length} Unlocked
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                  {achievements.map(ach => (
                    <div
                      key={ach.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '14px',
                        border: '1px solid var(--line)',
                        background: ach.unlocked ? 'var(--surface-2)' : 'transparent',
                        opacity: ach.unlocked ? 1 : 0.45,
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: 'var(--surface)',
                          display: 'grid',
                          placeItems: 'center',
                          border: '1px solid var(--line)',
                          flex: 'none',
                        }}
                      >
                        <Icon name={ach.icon} size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <b style={{ fontSize: '13px', display: 'block' }}>{ach.title}</b>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{ach.copy}</span>
                      </div>
                      {ach.unlocked && <Icon name="check" size={16} />}
                    </div>
                  ))}
                </div>
              </section>

              {/* Body Measurements Card */}
              <section className="card" style={{ marginTop: '16px' }}>
                <div className="section-head">
                  <div className="heading-with-icon">
                    <Icon name="scale" />
                    <h2>Physique & Body Measurements</h2>
                  </div>
                  <span className="mono muted">PROGRESSIVE PHYSIQUE TRACKER</span>
                </div>

                <div className="measurement-grid">
                  {/* Weight Panel */}
                  <article className="measurement-panel">
                    <div className="measurement-heading">
                      <span>Body Weight</span>
                      <b>{currentWeight ? `${currentWeight.value} ${data.weightUnit}` : '—'}</b>
                    </div>
                    <p className="small muted">
                      {startingWeight
                        ? `Starting: ${startingWeight.value} ${data.weightUnit} · ${formatSignedChange(
                            currentWeight ? currentWeight.value - startingWeight.value : 0,
                            data.weightUnit
                          )}`
                        : 'No starting weight logged yet'}
                    </p>
                    <MeasurementTrend items={data.bodyMeasurements.weight} unit={data.weightUnit} />
                    <div style={{ display: 'grid', gap: '6px', marginTop: '14px', maxHeight: '140px', overflowY: 'auto' }}>
                      {data.bodyMeasurements.weight
                        .slice()
                        .reverse()
                        .map(item => (
                          <div
                            key={item.date}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              font: '10px var(--mono)',
                              borderTop: '1px solid var(--line)',
                              paddingTop: '6px',
                            }}
                          >
                            <span>{item.date}</span>
                            <b>
                              {item.value} {data.weightUnit}
                            </b>
                            <button
                              type="button"
                              className="text-button"
                              style={{ color: 'var(--muted)', fontSize: '9px' }}
                              onClick={() => removeMeasurement('weight', item.date)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                    </div>
                  </article>

                  {/* Waist Panel */}
                  <article className="measurement-panel">
                    <div className="measurement-heading">
                      <span>Waist Size</span>
                      <b>{currentWaist ? `${currentWaist.value} cm` : '—'}</b>
                    </div>
                    <p className="small muted">
                      {startingWaist
                        ? `Starting: ${startingWaist.value} cm · ${formatSignedChange(
                            currentWaist ? currentWaist.value - startingWaist.value : 0,
                            'cm'
                          )}`
                        : 'No starting waist logged yet'}
                    </p>
                    <MeasurementTrend items={data.bodyMeasurements.waist} unit="cm" />
                    <div style={{ display: 'grid', gap: '6px', marginTop: '14px', maxHeight: '140px', overflowY: 'auto' }}>
                      {data.bodyMeasurements.waist
                        .slice()
                        .reverse()
                        .map(item => (
                          <div
                            key={item.date}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              font: '10px var(--mono)',
                              borderTop: '1px solid var(--line)',
                              paddingTop: '6px',
                            }}
                          >
                            <span>{item.date}</span>
                            <b>{item.value} cm</b>
                            <button
                              type="button"
                              className="text-button"
                              style={{ color: 'var(--muted)', fontSize: '9px' }}
                              onClick={() => removeMeasurement('waist', item.date)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                    </div>
                  </article>
                </div>

                {/* Entry Form */}
                <div className="measurement-entry">
                  <div className="field">
                    <label htmlFor="measure-date">Date</label>
                    <input
                      id="measure-date"
                      type="date"
                      value={measurementDate}
                      onChange={e => setMeasurementDate(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="weight-input">Weight ({data.weightUnit})</label>
                    <input
                      id="weight-input"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 78.5"
                      value={weightDraft}
                      onChange={e => setWeightDraft(e.target.value)}
                    />
                  </div>
                  <button type="button" className="button" onClick={() => addMeasurement('weight', weightDraft)}>
                    Save Weight
                  </button>
                  <div className="field">
                    <label htmlFor="waist-input">Waist (cm)</label>
                    <input
                      id="waist-input"
                      type="number"
                      step="0.5"
                      placeholder="e.g. 82"
                      value={waistDraft}
                      onChange={e => setWaistDraft(e.target.value)}
                    />
                  </div>
                  <button type="button" className="button secondary" onClick={() => addMeasurement('waist', waistDraft)}>
                    Save Waist
                  </button>
                </div>
              </section>
            </>
          )}

          {/* TAB 5: PROFILE & SETTINGS */}
          {tab === 'profile' && (
            <>
              <div className="hero">
                <div>
                  <div className="eyebrow">SETTINGS & PREFERENCES</div>
                  <h1>SETTINGS.</h1>
                  <p>Configure gym preferences, rest intervals, themes, and manage local data backups.</p>
                </div>
              </div>

              <div className="profile-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
                {/* Profile Identity Card */}
                <section className="card">
                  <div className="section-head">
                    <div className="heading-with-icon">
                      <Icon name="profile" />
                      <h2>Lifter Identity</h2>
                    </div>
                    <span className="mono muted">OFFLINE & PRIVATE</span>
                  </div>

                  <div className="profile-editor">
                    <div className="profile-photo-wrap">
                      {data.profilePhoto ? (
                        <img src={data.profilePhoto} alt="Your profile" className="profile-photo" />
                      ) : (
                        <div className="profile-photo avatar-placeholder">
                          <Icon name="profile" size={42} />
                        </div>
                      )}
                      <label className="photo-button" htmlFor="profile-photo-file">
                        <Icon name="upload" size={14} />
                        {data.profilePhoto ? 'Change Photo' : 'Upload Photo'}
                      </label>
                      <input
                        id="profile-photo-file"
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handlePhoto}
                      />
                      {data.profilePhoto && (
                        <button
                          type="button"
                          className="text-button"
                          style={{ color: 'var(--muted)', fontSize: '10px' }}
                          onClick={() => updateData({ profilePhoto: '' })}
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>

                    <div className="form">
                      <div className="field">
                        <label htmlFor="lifter-name">Lifter Name</label>
                        <input
                          id="lifter-name"
                          type="text"
                          value={data.name}
                          onChange={e => updateData({ name: e.target.value.slice(0, 80) })}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="field">
                          <label htmlFor="theme-select">Interface Theme</label>
                          <select
                            id="theme-select"
                            value={data.theme}
                            onChange={e => updateData({ theme: e.target.value as AppData['theme'] })}
                          >
                            <option value="system">System (Auto)</option>
                            <option value="dark">Dark Titanium</option>
                            <option value="light">Crisp Light</option>
                          </select>
                        </div>

                        <div className="field">
                          <label htmlFor="weight-unit-select">Weight Unit</label>
                          <select
                            id="weight-unit-select"
                            value={data.weightUnit}
                            onChange={e => updateData({ weightUnit: e.target.value as WeightUnit })}
                          >
                            <option value="kg">Kilograms (kg)</option>
                            <option value="lbs">Pounds (lbs)</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="field">
                          <label htmlFor="rest-preset-select">Default Rest Timer</label>
                          <select
                            id="rest-preset-select"
                            value={data.defaultRestSeconds}
                            onChange={e => updateData({ defaultRestSeconds: Number(e.target.value) })}
                          >
                            {REST_PRESETS.map(sec => (
                              <option value={sec} key={sec}>
                                {sec} seconds ({Math.floor(sec / 60) > 0 ? `${Math.floor(sec / 60)}m ` : ''}
                                {sec % 60 > 0 ? `${sec % 60}s` : ''})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="field">
                          <label htmlFor="sound-select">Sound Effects (Web Audio)</label>
                          <select
                            id="sound-select"
                            value={data.soundEnabled ? 'on' : 'off'}
                            onChange={e => updateData({ soundEnabled: e.target.value === 'on' })}
                          >
                            <option value="on">Enabled (Beeps & Chimes)</option>
                            <option value="off">Muted (Silent)</option>
                          </select>
                        </div>
                      </div>

                      <div className="field">
                        <label htmlFor="passcode-input">Access Passcode (Leave blank to disable lock)</label>
                        <input
                          id="passcode-input"
                          type="text"
                          placeholder="e.g. coco1513"
                          value={data.passcode}
                          onChange={e => updateData({ passcode: e.target.value.trim() })}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Data Backup & Restore */}
                <section className="card">
                  <div className="section-head">
                    <div className="heading-with-icon">
                      <Icon name="download" />
                      <h2>Data Backup</h2>
                    </div>
                  </div>

                  <p className="muted" style={{ fontSize: '13px', lineHeight: 1.5 }}>
                    Your entire training log, personal records, body measurements, and custom workouts live solely on this device. Create backups to keep your data safe.
                  </p>

                  <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
                    <button type="button" className="button" onClick={exportJson}>
                      <Icon name="download" size={15} /> Export Backup (JSON)
                    </button>

                    <label className="button secondary" htmlFor="import-file" style={{ cursor: 'pointer' }}>
                      <Icon name="upload" size={15} /> Import Backup (JSON)
                    </label>
                    <input
                      id="import-file"
                      type="file"
                      accept=".json,application/json"
                      hidden
                      onChange={handleImport}
                    />

                    <button
                      type="button"
                      className="button danger"
                      style={{ marginTop: '10px' }}
                      onClick={() => {
                        if (confirm('Are you sure you want to reset all workout and body measurement data?')) {
                          resetData();
                          notify('All local data reset');
                        }
                      }}
                    >
                      <Icon name="trash" size={15} /> Reset Local Data
                    </button>
                  </div>
                </section>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Floating Modal for Adding Custom Exercise */}
      {showAddModal && (
        <AddExerciseModal
          initialDay={day}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddCustomExercise}
        />
      )}

      {/* Bottom Navigation */}
      <nav className="nav" aria-label="Primary navigation">
        {NAV.map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'active' : ''}
            onClick={() => setTab(id)}
          >
            <Icon name={icon as IconName} size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Toast Notification */}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
