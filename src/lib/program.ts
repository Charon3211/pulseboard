import type { WorkoutDay, Exercise } from './types';

function toExercise(x: (string | number)[]): Exercise {
  return { name: String(x[0]), equipment: String(x[1]), sets: Number(x[2]), reps: String(x[3]), muscle: String(x[4]) };
}

export const PROGRAM: WorkoutDay[] = [
  { dow: 'MON', long: 'Monday', type: 'Chest + Shoulders', focus: 'Chest · Delts · Triceps', ex: [
    ['Incline Dumbbell Press', 'Dumbbell', 3, '6–10', 'Chest'], ['Dumbbell Shoulder Press', 'Dumbbell', 3, '8–12', 'Shoulders'], ['Cable Fly', 'Cable', 3, '12–15', 'Chest'], ['Cable Lateral Raise', 'Cable', 4, '12–20', 'Shoulders'], ['Triceps Rope Pushdown', 'Cable', 3, '10–15', 'Triceps'], ['Overhead Cable Triceps Extension', 'Cable', 3, '10–15', 'Triceps'], ['Incline Treadmill Walk', 'Treadmill', 1, '15–20 min', 'Cardio'],
  ].map(toExercise) },
  { dow: 'TUE', long: 'Tuesday', type: 'V-Taper + Back', focus: 'Lats · Back · Rear Delts · Arms', ex: [
    ['Pull-Ups', 'Bodyweight', 3, '5–10', 'Back'], ['Lat Pulldown', 'Cable', 3, '8–12', 'Back'], ['Chest-Supported Row', 'Machine', 3, '8–12', 'Back'], ['Single-Arm Cable Pulldown', 'Cable', 2, '10–15', 'Lats'], ['Reverse Pec Deck', 'Machine', 3, '12–15', 'Shoulders'], ['Dumbbell Curl', 'Dumbbell', 3, '10–15', 'Biceps'], ['Hammer Curl', 'Dumbbell', 2, '10–15', 'Biceps'], ['Incline Treadmill Walk', 'Treadmill', 1, '15–20 min', 'Cardio'],
  ].map(toExercise) },
  { dow: 'WED', long: 'Wednesday', type: 'Legs', focus: 'Quads · Hamstrings · Calves', ex: [
    ['Barbell Squat', 'Barbell', 3, '6–10', 'Legs'], ['Glute-Ham Raise', 'Bodyweight', 3, '8–12', 'Hamstrings'], ['Dumbbell Lunge', 'Dumbbell', 3, '10–15', 'Legs'], ['Lying Leg Curl', 'Machine', 3, '10–15', 'Hamstrings'], ['Standing Calf Raise', 'Machine', 3, '10–15', 'Calves'], ['Easy Treadmill Walk', 'Treadmill', 1, '10–15 min', 'Cardio'],
  ].map(toExercise) },
  { dow: 'THU', long: 'Thursday', type: 'V-Taper + Upper Body', focus: 'Chest · Back · Delts · Abs', ex: [
    ['Incline Machine Press', 'Machine', 3, '8–12', 'Chest'], ['Pull-Ups', 'Bodyweight', 3, '5–10', 'Back'], ['Chest-Supported Row', 'Machine', 3, '8–12', 'Back'], ['Machine Lateral Raise', 'Machine', 4, '12–20', 'Shoulders'], ['Straight-Arm Cable Pulldown', 'Cable', 3, '10–15', 'Lats'], ['Cable Fly', 'Cable', 3, '12–15', 'Chest'], ['Cable Crunch', 'Cable', 3, '10–15', 'Core'], ['Incline Treadmill Walk', 'Treadmill', 1, '15–20 min', 'Cardio'],
  ].map(toExercise) },
  { dow: 'FRI', long: 'Friday', type: 'Off', focus: 'Recovery · Mobility · Sleep', ex: [] },
  { dow: 'SAT', long: 'Saturday', type: 'Cardio + Core', focus: 'Conditioning · Core', ex: [
    ['Incline Treadmill Walk', 'Treadmill', 1, '30–40 min', 'Cardio'], ['Hanging Knee Raise', 'Bodyweight', 3, '10–15', 'Core'], ['Ab Wheel', 'Bodyweight', 3, '6–12', 'Core'],
  ].map(toExercise) },
  { dow: 'SUN', long: 'Sunday', type: 'Lower Body + Abs', focus: 'Quads · Posterior Chain · Abs', ex: [
    ['Leg Press', 'Machine', 3, '8–12', 'Legs'], ['Romanian Deadlift', 'Barbell', 3, '8–10', 'Hamstrings'], ['Leg Extension', 'Machine', 3, '12–15', 'Quads'], ['Seated Calf Raise', 'Machine', 4, '12–20', 'Calves'], ['Reverse Crunch', 'Bodyweight', 3, '10–15', 'Core'], ['Cable Crunch', 'Cable', 3, '10–15', 'Core'], ['Easy Treadmill Walk', 'Treadmill', 1, '10–15 min', 'Cardio'],
  ].map(toExercise) },
];

export const HABITS = ['Sleep Hours', 'Protein Target', 'Workout Completed', 'Exercise Duration', 'Water Intake', 'Daily Movement', 'Recovery'] as const;
export const DERIVED_HABITS = new Set(['Sleep Hours', 'Protein Target', 'Workout Completed']);
export const QUOTES = ['Consistency compounds quietly.', 'Do the next useful thing.', 'Strong habits make strong days.', 'Train with intention, recover with respect.', 'Small actions. Serious momentum.', 'You do not need perfect. You need repeatable.'];
export const NAV = [['home', 'Home', 'home'], ['workout', 'Workout', 'workout'], ['habits', 'Habits', 'habits'], ['stats', 'Stats', 'stats'], ['profile', 'Profile', 'profile']] as const;
