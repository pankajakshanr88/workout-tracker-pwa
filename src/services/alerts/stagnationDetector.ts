import { getWorkoutsByExercise } from '../database/workouts';
import { getSetsByExercise } from '../database/sets';
import { getExerciseById } from '../database/exercises';
import { getAllExercises } from '../database/exercises';
import { createAlert, hasExistingAlert } from '../database/alerts';

export interface StagnationAlert {
  type: 'stagnation';
  severity: 'warning' | 'error';
  exerciseId: number;
  exerciseName: string;
  message: string;
  interventions: string[];
  workoutsAnalyzed: number;
  stagnantWorkouts: number;
  currentWeight: number;
  lastWeightIncrease: string | null;
}

export interface StagnationAnalysis {
  isStagnating: boolean;
  alert: StagnationAlert | null;
  metrics: {
    totalWorkouts: number;
    stagnantWorkouts: number;
    currentWeight: number;
    weightProgression: number[];
    lastIncrease: string | null;
  };
}

/**
 * Detect stagnation for a specific exercise
 * Triggers when weight hasn't increased in 3+ consecutive workouts
 */
export function detectStagnation(exerciseId: number): StagnationAlert | null {
  // Get recent workouts for this exercise (last 5)
  const recentWorkouts = getWorkoutsByExercise(exerciseId, 5);

  if (recentWorkouts.length < 3) {
    return null; // Not enough data to detect stagnation
  }

  // Get exercise info
  const exercise = getExerciseById(exerciseId);
  if (!exercise) return null;

  // Get all sets for this exercise (excluding warmups)
  const exerciseSets = getSetsByExercise(exerciseId, 50);

  // Find the maximum weight used in recent workouts
  const recentWeights = recentWorkouts.map(workout => {
    const workoutSets = exerciseSets.filter(s => s.workout_id === workout.id);
    return Math.max(...workoutSets.map(s => s.weight));
  });

  // Check for stagnation: same weight for 3+ consecutive workouts
  let stagnantCount = 0;
  const firstWeight = recentWeights[0];

  for (let i = 0; i < recentWeights.length; i++) {
    if (recentWeights[i] === firstWeight) {
      stagnantCount++;
    } else {
      break; // Found an increase, stop counting
    }
  }

  // Trigger alert if 3+ workouts at same weight
  if (stagnantCount >= 3) {
    return {
      type: 'stagnation',
      severity: stagnantCount >= 4 ? 'error' : 'warning',
      exerciseId,
      exerciseName: exercise.name,
      message: generateStagnationMessage(stagnantCount, exercise.name),
      interventions: generateInterventions(stagnantCount, firstWeight),
      workoutsAnalyzed: recentWorkouts.length,
      stagnantWorkouts: stagnantCount,
      currentWeight: firstWeight,
      lastWeightIncrease: findLastWeightIncrease(exerciseId, firstWeight)
    };
  }

  return null;
}

/**
 * Analyze stagnation for all exercises
 */
export function analyzeAllExercisesStagnation(): StagnationAlert[] {
  const exercises = getAllExercises();

  const alerts: StagnationAlert[] = [];

  exercises.forEach((exercise: any) => {
    const alert = detectStagnation(exercise.id);
    if (alert) {
      alerts.push(alert);
    }
  });

  return alerts;
}

function generateStagnationMessage(stagnantWorkouts: number, exerciseName: string): string {
  if (stagnantWorkouts >= 4) {
    return `${exerciseName} has been stuck at the same weight for ${stagnantWorkouts} workouts. Time for a change!`;
  }
  return `${exerciseName} hasn't progressed in ${stagnantWorkouts} workouts. Consider an intervention.`;
}

function generateInterventions(stagnantWorkouts: number, _currentWeight: number): string[] {
  const interventions = [
    'Deload to 90% of current weight for 1 week to recover',
    'Switch to 3×8-12 reps instead of 5×5 to build volume',
    'Add 1 extra set per workout (6×5 instead of 5×5)',
    'Try a different variation (front squat, incline bench, etc.)',
    'Take a full rest day and focus on recovery',
    'Review your nutrition and sleep quality'
  ];

  // Prioritize interventions based on stagnation severity
  if (stagnantWorkouts >= 4) {
    return [
      interventions[0], // Deload first for severe stagnation
      interventions[1], // Rep range change
      interventions[3], // Variation change
      interventions[4]  // Rest and recovery
    ];
  }

  return [
    interventions[1], // Rep range change first
    interventions[2], // Extra set
    interventions[3], // Variation
    interventions[0]  // Deload as last resort
  ];
}

function findLastWeightIncrease(exerciseId: number, currentWeight: number): string | null {
  // Get all sets for this exercise
  const exerciseSets = getSetsByExercise(exerciseId, 100);

  // Group sets by workout and find max weight per workout
  const workoutWeights: { [workoutId: number]: number } = {};
  exerciseSets.forEach(set => {
    if (!workoutWeights[set.workout_id] || set.weight > workoutWeights[set.workout_id]) {
      workoutWeights[set.workout_id] = set.weight;
    }
  });

  // Sort workouts by date and find last increase
  const sortedWorkouts = Object.entries(workoutWeights)
    .sort(([,a], [,b]) => b - a) // Sort by weight descending
    .filter(([,weight]) => weight < currentWeight); // Only workouts with lower weight

  if (sortedWorkouts.length === 0) return null;

  // Get the workout date for the last increase
  const lastIncreaseWorkoutId = parseInt(sortedWorkouts[0][0]);
  const workout = getWorkoutsByExercise(exerciseId, 10).find(w => w.id === lastIncreaseWorkoutId);

  return workout?.date || null;
}

/**
 * Check if a workout should trigger a stagnation alert
 */
export function checkWorkoutForStagnation(_workoutId: number): StagnationAlert | null {
  // This would analyze the current workout against recent history
  // For now, return null - will implement with proper logic
  return null;
}

/**
 * Process stagnation detection and create alerts for all exercises
 * This should be called after each workout completion
 */
export function processStagnationAlerts(): void {
  const exercises = getAllExercises();

  exercises.forEach(exercise => {
    // Check if stagnation alert already exists
    if (hasExistingAlert(exercise.id, 'stagnation')) {
      return; // Skip if alert already exists
    }

    // Detect stagnation
    const stagnationAlert = detectStagnation(exercise.id);
    if (stagnationAlert) {
      // Create alert in database (convert severity to database format)
      const severity = stagnationAlert.severity === 'error' ? 'critical' : 'warning';
      createAlert(
        exercise.id,
        stagnationAlert.type,
        severity,
        stagnationAlert.message
      );
    }
  });
}
