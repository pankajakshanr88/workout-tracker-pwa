import { getWorkoutsByExercise } from '../database/workouts';
import { getSetsByExercise } from '../database/sets';
import { getExerciseById } from '../database/exercises';
import { getAllExercises } from '../database/exercises';
import { createAlert, hasExistingAlert } from '../database/alerts';

export interface SandbaggingAlert {
  type: 'sandbagging';
  severity: 'warning';
  exerciseId: number;
  exerciseName: string;
  message: string;
  suggestion: string;
  workoutsAnalyzed: number;
  flatRepWorkouts: number;
  averageRepRange: number;
  currentWeight: number;
}

export interface SandbaggingAnalysis {
  isSandbagging: boolean;
  alert: SandbaggingAlert | null;
  metrics: {
    totalWorkouts: number;
    flatRepWorkouts: number;
    averageRepRange: number;
    currentWeight: number;
    repProgression: number[][];
  };
}

/**
 * Detect sandbagging for a specific exercise
 * Triggers when reps are flat (max - min ≤ 1) across 3+ sets for 2+ workouts
 * This indicates the user isn't training to true 1 RIR failure
 */
export function detectSandbagging(exerciseId: number): SandbaggingAlert | null {
  // Get recent workouts for this exercise (last 3)
  const recentWorkouts = getWorkoutsByExercise(exerciseId, 3);

  if (recentWorkouts.length < 2) {
    return null; // Not enough data to detect sandbagging
  }

  // Get exercise info
  const exercise = getExerciseById(exerciseId);
  if (!exercise) return null;

  // Get all sets for recent workouts
  const exerciseSets = getSetsByExercise(exerciseId, 20);
  const currentWeight = Math.max(...exerciseSets.map(s => s.weight));

  // Analyze each workout for flat rep patterns
  let flatRepWorkouts = 0;
  const repProgressions: number[][] = [];

  recentWorkouts.forEach(workout => {
    const workoutSets = exerciseSets
      .filter(s => s.workout_id === workout.id && !s.is_warmup)
      .sort((a, b) => a.set_number - b.set_number);

    if (workoutSets.length >= 3) {
      const reps = workoutSets.map(s => s.reps);
      const maxReps = Math.max(...reps);
      const minReps = Math.min(...reps);
      const repRange = maxReps - minReps;

      repProgressions.push(reps);

      // Check for flat reps (range ≤ 1)
      if (repRange <= 1) {
        flatRepWorkouts++;
      }
    }
  });

  // Trigger alert if 2+ workouts have flat rep patterns
  if (flatRepWorkouts >= 2) {
    const averageRepRange = calculateAverageRepRange(repProgressions);

    return {
      type: 'sandbagging',
      severity: 'warning',
      exerciseId,
      exerciseName: exercise.name,
      message: generateSandbaggingMessage(flatRepWorkouts, exercise.name),
      suggestion: generateSandbaggingSuggestion(currentWeight, averageRepRange),
      workoutsAnalyzed: recentWorkouts.length,
      flatRepWorkouts,
      averageRepRange,
      currentWeight
    };
  }

  return null;
}

/**
 * Analyze sandbagging for all exercises
 */
export function analyzeAllExercisesSandbagging(): SandbaggingAlert[] {
  const exercises = getAllExercises();
  const alerts: SandbaggingAlert[] = [];

  exercises.forEach(exercise => {
    const alert = detectSandbagging(exercise.id);
    if (alert) {
      alerts.push(alert);
    }
  });

  return alerts;
}

function calculateAverageRepRange(repProgressions: number[][]): number {
  if (repProgressions.length === 0) return 0;

  const ranges = repProgressions.map(reps => {
    const max = Math.max(...reps);
    const min = Math.min(...reps);
    return max - min;
  });

  return ranges.reduce((sum, range) => sum + range, 0) / ranges.length;
}

function generateSandbaggingMessage(flatWorkouts: number, exerciseName: string): string {
  if (flatWorkouts >= 3) {
    return `${exerciseName} reps aren't dropping across sets in ${flatWorkouts} workouts. You might not be training to true failure.`;
  }
  return `${exerciseName} shows consistent reps across sets in ${flatWorkouts} workouts. Consider pushing harder to 1 RIR.`;
}

function generateSandbaggingSuggestion(_currentWeight: number, averageRepRange: number): string {
  if (averageRepRange <= 1) {
    return `Add 5-10lbs and push until reps start dropping (Set 1: 8-10 reps, Set 5: 5-7 reps)`;
  }
  return `Focus on progressive overload - increase weight when you can complete all sets at target reps`;
}

/**
 * Process sandbagging detection and create alerts for all exercises
 */
export function processSandbaggingAlerts(): void {
  const exercises = getAllExercises();

  exercises.forEach(exercise => {
    // Check if sandbagging alert already exists
    if (hasExistingAlert(exercise.id, 'sandbagging')) {
      return; // Skip if alert already exists
    }

    // Detect sandbagging
    const sandbaggingAlert = detectSandbagging(exercise.id);
    if (sandbaggingAlert) {
      // Create alert in database (convert severity to database format)
      const severity = sandbaggingAlert.severity === 'warning' ? 'warning' : 'critical';
      createAlert(
        exercise.id,
        sandbaggingAlert.type,
        severity,
        sandbaggingAlert.message
      );
    }
  });
}
