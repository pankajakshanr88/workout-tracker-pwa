import { getWorkoutsInRange } from '../database/workouts';
import { getExerciseById } from '../database/exercises';
import { executeQuery } from '../database/init';

export interface VolumeAnalysis {
  muscleGroup: string;
  totalSets: number;
  status: 'too_low' | 'optimal' | 'too_high';
  recommendation: string;
  percentage: number; // Percentage of optimal (10-15 sets)
}

export interface WeeklyVolumeReport {
  weekStart: string; // ISO date string
  weekEnd: string; // ISO date string
  muscleGroups: VolumeAnalysis[];
  overallBalance: 'balanced' | 'unbalanced';
  recommendations: string[];
}

/**
 * Map exercises to their primary muscle groups
 */
export function getExerciseMuscleMap(): Record<string, string> {
  return {
    // Legs
    squat: 'legs',
    deadlift: 'legs',
    lunge: 'legs',
    'leg press': 'legs',
    'leg curl': 'legs',
    'leg extension': 'legs',

    // Chest
    bench: 'chest',
    'incline bench': 'chest',
    'decline bench': 'chest',
    'chest fly': 'chest',
    'push up': 'chest',

    // Back
    row: 'back',
    'pull up': 'back',
    'lat pulldown': 'back',
    'conventional deadlift': 'back', // Secondary
    'face pull': 'back',

    // Shoulders
    press: 'shoulders',
    'lateral raise': 'shoulders',
    'front raise': 'shoulders',
    'rear delt': 'shoulders',

    // Arms
    'bicep curl': 'arms',
    'tricep extension': 'arms',
    'tricep dip': 'arms',
    'hammer curl': 'arms',

    // Core
    'plank': 'core',
    'crunch': 'core',
    'russian twist': 'core'
  };
}

/**
 * Get the muscle group for an exercise name
 */
export function getExerciseMuscleGroup(exerciseName: string): string {
  const muscleMap = getExerciseMuscleMap();
  const normalizedName = exerciseName.toLowerCase();

  // Check exact matches first
  for (const [exercise, muscle] of Object.entries(muscleMap)) {
    if (normalizedName.includes(exercise)) {
      return muscle;
    }
  }

  // Default to 'other' if no match found
  return 'other';
}

/**
 * Calculate volume for a specific muscle group in the last 7 days
 */
export function analyzeWeeklyVolume(muscleGroup: string): VolumeAnalysis {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekEnd = new Date();

  const weekStartStr = weekStart.toISOString().split('T')[0];
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  // Get workouts from last 7 days
  const weekWorkouts = getWorkoutsInRange(weekStartStr, weekEndStr);

  // Count sets per muscle group (excluding warmups)
  let totalSets = 0;
  weekWorkouts.forEach(workout => {
    // Get all sets for this workout
    const workoutSets = executeQuery(
      'SELECT * FROM sets WHERE workout_id = ? AND is_warmup = 0',
      [workout.id]
    );

    workoutSets.forEach((set: any) => {
      // Get exercise name to determine muscle group
      const exercise = getExerciseById(set.exercise_id);
      if (exercise && getExerciseMuscleGroup(exercise.name) === muscleGroup) {
        totalSets++;
      }
    });
  });

  // Optimal range: 10-15 sets per week
  const optimalMin = 10;
  const optimalMax = 15;

  let status: 'too_low' | 'optimal' | 'too_high';
  let recommendation: string;

  if (totalSets < optimalMin) {
    status = 'too_low';
    recommendation = `Add ${optimalMin - totalSets} more ${muscleGroup} sets this week`;
  } else if (totalSets > optimalMax) {
    status = 'too_high';
    recommendation = `Reduce ${muscleGroup} volume by ${totalSets - optimalMax} sets (consider deload)`;
  } else {
    status = 'optimal';
    recommendation = `${muscleGroup} volume is perfect!`;
  }

  const percentage = Math.min((totalSets / optimalMax) * 100, 100);

  return {
    muscleGroup,
    totalSets,
    status,
    recommendation,
    percentage
  };
}

/**
 * Analyze volume for all muscle groups
 */
export function analyzeAllMuscleGroups(): VolumeAnalysis[] {
  const muscleGroups = ['legs', 'chest', 'back', 'shoulders', 'arms', 'core'];
  return muscleGroups.map(group => analyzeWeeklyVolume(group));
}

/**
 * Generate a complete weekly volume report
 */
export function generateWeeklyVolumeReport(): WeeklyVolumeReport {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekEnd = new Date();

  const muscleGroups = analyzeAllMuscleGroups();

  // Check overall balance
  const activeGroups = muscleGroups.filter(g => g.totalSets > 0);
  const optimalGroups = activeGroups.filter(g => g.status === 'optimal').length;
  const balanceRatio = activeGroups.length > 0 ? optimalGroups / activeGroups.length : 0;

  const overallBalance: 'balanced' | 'unbalanced' =
    balanceRatio >= 0.7 ? 'balanced' : 'unbalanced';

  // Generate recommendations
  const recommendations: string[] = [];

  // Balance recommendations
  if (overallBalance === 'unbalanced') {
    const lowVolumeGroups = muscleGroups.filter(g => g.status === 'too_low');
    const highVolumeGroups = muscleGroups.filter(g => g.status === 'too_high');

    if (lowVolumeGroups.length > 0) {
      recommendations.push(`Focus on ${lowVolumeGroups.map(g => g.muscleGroup).join(', ')} - add more sets`);
    }

    if (highVolumeGroups.length > 0) {
      recommendations.push(`${highVolumeGroups.map(g => g.muscleGroup).join(', ')} volume is too high - consider reducing`);
    }
  }

  // Specific recommendations
  muscleGroups.forEach(group => {
    if (group.status !== 'optimal') {
      recommendations.push(group.recommendation);
    }
  });

  // If no specific recommendations, add general advice
  if (recommendations.length === 0) {
    recommendations.push('Great job! All muscle groups are in optimal volume range.');
  }

  return {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    muscleGroups,
    overallBalance,
    recommendations
  };
}

/**
 * Get volume status color for UI
 */
export function getVolumeStatusColor(status: VolumeAnalysis['status']): string {
  switch (status) {
    case 'too_low': return 'text-error';
    case 'optimal': return 'text-success';
    case 'too_high': return 'text-warning';
    default: return 'text-gray-500';
  }
}

/**
 * Get volume status background color for UI
 */
export function getVolumeStatusBg(status: VolumeAnalysis['status']): string {
  switch (status) {
    case 'too_low': return 'bg-error-light';
    case 'optimal': return 'bg-success-light';
    case 'too_high': return 'bg-warning-light';
    default: return 'bg-gray-100';
  }
}

