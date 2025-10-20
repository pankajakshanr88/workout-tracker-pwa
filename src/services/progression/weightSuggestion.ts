import { getLastWorkoutSets } from '../database/sets';
import { getExerciseById } from '../database/exercises';

/**
 * Calculates suggested weight for next workout based on last performance
 * Algorithm from spec lines 1056-1113
 */
export function suggestNextWeight(exerciseId: number): number {
  const lastSets = getLastWorkoutSets(exerciseId);
  
  if (lastSets.length === 0) {
    // First time doing exercise - return starting weight
    return getStartingWeight(exerciseId);
  }

  // Get first set data (Set 1 performance determines progression)
  const firstSet = lastSets[0];
  const lastWeight = firstSet.weight;
  const targetReps = firstSet.target_reps || 5;
  const actualReps = firstSet.reps;
  const rirResponse = firstSet.rir_response;

  // Get appropriate increment based on exercise category
  const increment = getWeightIncrement(exerciseId);

  // Progression rules from spec:
  if (actualReps >= targetReps && rirResponse === 'yes_easily') {
    // Hit target easily - double increment
    return lastWeight + (increment * 2);
  } else if (actualReps >= targetReps && rirResponse === 'yes_maybe') {
    // Hit target at 1 RIR - standard progression
    return lastWeight + increment;
  } else if (actualReps < targetReps - 2) {
    // Missed target by more than 2 reps - decrease by increment
    return Math.max(lastWeight - increment, getStartingWeight(exerciseId));
  } else {
    // Missed target by 1-2 reps - try same weight again
    return lastWeight;
  }
}

/**
 * Get starting weight for an exercise based on category
 * From spec lines 1096-1113
 */
function getStartingWeight(exerciseId: number): number {
  const exercise = getExerciseById(exerciseId);
  
  if (!exercise) return 45; // Default to empty bar

  const startingWeights: Record<string, number> = {
    'squat': 45,      // Just the bar
    'deadlift': 95,   // Bar + 25lb plates
    'bench': 45,      // Just the bar
    'press': 45,      // Just the bar
    'row': 65,        // Bar + 10lb plates
    'pull': 0,        // Bodyweight
    'accessory': 10   // Light dumbbells
  };

  return startingWeights[exercise.category] || 45;
}

/**
 * Get appropriate weight increment based on exercise type
 * Different exercises progress at different rates
 */
function getWeightIncrement(exerciseId: number): number {
  const exercise = getExerciseById(exerciseId);
  
  if (!exercise) return 5; // Default

  const increments: Record<string, number> = {
    'squat': 5,       // 5lbs per session
    'deadlift': 10,   // 10lbs per session (strongest lift)
    'bench': 5,       // 5lbs per session
    'press': 2.5,     // 2.5lbs per session (hardest to progress)
    'row': 5,         // 5lbs per session
    'pull': 2.5,      // 2.5lbs for weighted pull-ups
    'accessory': 2.5  // 2.5lbs for accessories
  };

  return increments[exercise.category] || 5;
}

/**
 * Get the last weight used for an exercise
 */
export function getLastWeight(exerciseId: number): number | null {
  const lastSets = getLastWorkoutSets(exerciseId);
  return lastSets.length > 0 ? lastSets[0].weight : null;
}

