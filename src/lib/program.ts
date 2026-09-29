import type { WorkoutDay, Exercise } from './types';

function toExercise(x: (string | number)[]): Exercise {
  return {
    name: String(x[0]),
    equipment: String(x[1]),
    sets: Number(x[2]),
    reps: String(x[3]),
    muscle: String(x[4]),
  };
}

export const PROGRAM: WorkoutDay[] = [
  {
    dow: 'MON',
    long: 'Monday',
    type: 'Chest + Shoulders',
    focus: 'Chest · Delts · Triceps',
    ex: [
      ['Incline Dumbbell Press', 'Dumbbell', 3, '6–10', 'Chest'],
      ['Dumbbell Shoulder Press', 'Dumbbell', 3, '8–12', 'Shoulders'],
      ['Cable Fly', 'Cable', 3, '12–15', 'Chest'],
      ['Cable Lateral Raise', 'Cable', 4, '12–20', 'Shoulders'],
      ['Triceps Rope Pushdown', 'Cable', 3, '10–15', 'Triceps'],
      ['Overhead Cable Triceps Extension', 'Cable', 3, '10–15', 'Triceps'],
      ['Incline Treadmill Walk', 'Treadmill', 1, '15–20 min', 'Cardio'],
    ].map(toExercise),
  },
  {
    dow: 'TUE',
    long: 'Tuesday',
    type: 'V-Taper + Back',
    focus: 'Lats · Back · Rear Delts · Arms',
    ex: [
      ['Pull-Ups', 'Bodyweight', 3, '5–10', 'Back'],
      ['Lat Pulldown', 'Cable', 3, '8–12', 'Back'],
      ['Chest-Supported Row', 'Machine', 3, '8–12', 'Back'],
      ['Single-Arm Cable Pulldown', 'Cable', 2, '10–15', 'Back'],
      ['Reverse Pec Deck', 'Machine', 3, '12–15', 'Shoulders'],
      ['Dumbbell Curl', 'Dumbbell', 3, '10–15', 'Biceps'],
      ['Hammer Curl', 'Dumbbell', 2, '10–15', 'Biceps'],
      ['Incline Treadmill Walk', 'Treadmill', 1, '15–20 min', 'Cardio'],
    ].map(toExercise),
  },
  {
    dow: 'WED',
    long: 'Wednesday',
    type: 'Legs',
    focus: 'Quads · Hamstrings · Calves',
    ex: [
      ['Barbell Squat', 'Barbell', 3, '6–10', 'Legs'],
      ['Glute-Ham Raise', 'Bodyweight', 3, '8–12', 'Legs'],
      ['Dumbbell Lunge', 'Dumbbell', 3, '10–15', 'Legs'],
      ['Lying Leg Curl', 'Machine', 3, '10–15', 'Legs'],
      ['Standing Calf Raise', 'Machine', 3, '10–15', 'Calves'],
      ['Easy Treadmill Walk', 'Treadmill', 1, '10–15 min', 'Cardio'],
    ].map(toExercise),
  },
  {
    dow: 'THU',
    long: 'Thursday',
    type: 'V-Taper + Upper Body',
    focus: 'Chest · Back · Delts · Abs',
    ex: [
      ['Incline Machine Press', 'Machine', 3, '8–12', 'Chest'],
      ['Pull-Ups', 'Bodyweight', 3, '5–10', 'Back'],
      ['Chest-Supported Row', 'Machine', 3, '8–12', 'Back'],
      ['Machine Lateral Raise', 'Machine', 4, '12–20', 'Shoulders'],
      ['Straight-Arm Cable Pulldown', 'Cable', 3, '10–15', 'Back'],
      ['Cable Fly', 'Cable', 3, '12–15', 'Chest'],
      ['Cable Crunch', 'Cable', 3, '10–15', 'Core'],
      ['Incline Treadmill Walk', 'Treadmill', 1, '15–20 min', 'Cardio'],
    ].map(toExercise),
  },
  {
    dow: 'FRI',
    long: 'Friday',
    type: 'Rest & Recovery',
    focus: 'Recovery · Mobility · Sleep',
    ex: [],
  },
  {
    dow: 'SAT',
    long: 'Saturday',
    type: 'Cardio + Core',
    focus: 'Conditioning · Core Strength',
    ex: [
      ['Incline Treadmill Walk', 'Treadmill', 1, '30–40 min', 'Cardio'],
      ['Hanging Knee Raise', 'Bodyweight', 3, '10–15', 'Core'],
      ['Ab Wheel', 'Bodyweight', 3, '6–12', 'Core'],
    ].map(toExercise),
  },
  {
    dow: 'SUN',
    long: 'Sunday',
    type: 'Lower Body + Abs',
    focus: 'Quads · Posterior Chain · Abs',
    ex: [
      ['Leg Press', 'Machine', 3, '8–12', 'Legs'],
      ['Romanian Deadlift', 'Barbell', 3, '8–10', 'Legs'],
      ['Leg Extension', 'Machine', 3, '12–15', 'Legs'],
      ['Seated Calf Raise', 'Machine', 4, '12–20', 'Calves'],
      ['Reverse Crunch', 'Bodyweight', 3, '10–15', 'Core'],
      ['Cable Crunch', 'Cable', 3, '10–15', 'Core'],
      ['Easy Treadmill Walk', 'Treadmill', 1, '10–15 min', 'Cardio'],
    ].map(toExercise),
  },
];

export const GYM_QUOTES = [
  'Progressive overload is the law of the iron.',
  'Consistency builds what motivation cannot.',
  'Every rep is a contract with your future self.',
  'Form first, intensity second, ego never.',
  'The body achieves what the mind believes.',
  'Track your lifts. Beat your numbers. Build the physique.',
  'Tired is temporary. The strength you build lasts.',
];

export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Legs',
  'Calves',
  'Biceps',
  'Triceps',
  'Core',
  'Cardio',
] as const;

export const REST_PRESETS = [30, 45, 60, 90, 120, 180] as const;

export const NAV = [
  ['home', 'Home', 'home'],
  ['workout', 'Workout', 'workout'],
  ['exercises', 'Exercises', 'dumbbell'],
  ['stats', 'Analytics', 'stats'],
  ['profile', 'Settings', 'profile'],
] as const;
