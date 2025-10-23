import { getLastWorkoutSets } from '../database/sets';
import { getExerciseById } from '../database/exercises';

/**
 * Calculates suggested weight for next workout based on last performance
 * Algorithm from spec lines 1056-1113
 */
export function suggestNextWeight(exerciseId: number): number {
  console.log(`Calculating suggested weight for exercise ${exerciseId}`);

  try {
    const lastSets = getLastWorkoutSets(exerciseId);
    console.log(`Found ${lastSets.length} last sets for exercise ${exerciseId}`);

    if (lastSets.length === 0) {
      // First time doing exercise - return starting weight
      const startingWeight = getStartingWeight(exerciseId);
      console.log(`No previous sets found, using starting weight: ${startingWeight}lbs`);
      return startingWeight;
    }

  // Get first set data (Set 1 performance determines progression)
  const firstSet = lastSets[0];
  const lastWeight = firstSet.weight;
  const targetReps = firstSet.target_reps || 5;
  const actualReps = firstSet.reps;
  const rirResponse = firstSet.rir_response;

  console.log(`Last performance: ${lastWeight}lbs × ${actualReps} reps (target: ${targetReps}), RIR: ${rirResponse}`);

  // Get appropriate increment based on exercise category
  const increment = getWeightIncrement(exerciseId);
  console.log(`Weight increment for this exercise: ${increment}lbs`);

  let suggestedWeight: number;

  // Progression rules from spec:
  if (actualReps >= targetReps && rirResponse === 'yes_easily') {
    // Hit target easily - double increment
    suggestedWeight = lastWeight + (increment * 2);
    console.log(`Hit target easily - suggesting ${suggestedWeight}lbs (+${increment * 2})`);
  } else if (actualReps >= targetReps && rirResponse === 'yes_maybe') {
    // Hit target at 1 RIR - standard progression
    suggestedWeight = lastWeight + increment;
    console.log(`Hit target at 1 RIR - suggesting ${suggestedWeight}lbs (+${increment})`);
  } else if (actualReps < targetReps - 2) {
    // Missed target by more than 2 reps - decrease by increment
    suggestedWeight = Math.max(lastWeight - increment, getStartingWeight(exerciseId));
    console.log(`Missed target by >2 reps - suggesting ${suggestedWeight}lbs (-${increment})`);
  } else {
    // Missed target by 1-2 reps - try same weight again
    suggestedWeight = lastWeight;
    console.log(`Missed target by 1-2 reps - suggesting same weight: ${suggestedWeight}lbs`);
  }

  return suggestedWeight;
  } catch (error) {
    console.error('Error calculating suggested weight:', error);
    // Fallback to starting weight
    return getStartingWeight(exerciseId);
  }
}

/**
 * Get starting weight for an exercise based on category
 * From spec lines 1096-1113
 */
function getStartingWeight(exerciseId: number): number {
  const exercise = getExerciseById(exerciseId);

  if (!exercise) {
    console.warn(`Exercise with ID ${exerciseId} not found, using default weight`);
    return 45; // Default to empty bar
  }

  const startingWeights: Record<string, number> = {
    'squat': 45,      // Just the bar
    'deadlift': 95,   // Bar + 25lb plates
    'bench': 45,      // Just the bar
    'press': 45,      // Just the bar
    'row': 65,        // Bar + 10lb plates
    'pull': 0,        // Bodyweight
    'accessory': 10   // Light dumbbells
  };

  const weight = startingWeights[exercise.category];
  if (weight === undefined) {
    console.warn(`Unknown exercise category '${exercise.category}' for ${exercise.name}, using default`);
    return 45;
  }

  console.log(`Starting weight for ${exercise.name} (${exercise.category}): ${weight}lbs`);
  return weight;
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

