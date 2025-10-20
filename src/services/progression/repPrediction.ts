import type { RIRResponse } from '../../types/database';
import type { RepPrediction } from '../../types/workout';

/**
 * Predicts expected reps for upcoming sets based on Set 1 performance
 * Algorithm from spec lines 1118-1159
 */
export function predictReps(
  set1Reps: number,
  set1RIR: RIRResponse,
  setNumber: number
): RepPrediction {
  // Decay factor based on RIR (how much fatigue accumulates)
  const decayFactors: Record<RIRResponse, number> = {
    'yes_maybe': 0.875,   // Good 1 RIR - moderate fatigue
    'yes_easily': 0.925,  // Too easy - less fatigue
    'no_way': 0.825       // Complete failure - more fatigue
  };

  const decayFactor = decayFactors[set1RIR];

  // Calculate expected reps using decay formula
  const expectedReps = set1Reps * Math.pow(decayFactor, setNumber - 1);

  // Return range with ±1 rep margin
  const minReps = Math.max(1, Math.floor(expectedReps - 1));
  const maxReps = Math.ceil(expectedReps + 1);

  return {
    min: minReps,
    max: maxReps,
    expected: Math.round(expectedReps)
  };
}

/**
 * Format rep prediction as user-friendly string
 */
export function formatRepPrediction(prediction: RepPrediction): string {
  if (prediction.min === prediction.max) {
    return `${prediction.expected} reps`;
  }
  return `${prediction.min}-${prediction.max} reps`;
}

/**
 * Get RIR feedback message for display
 */
export function getRIRFeedback(rirResponse: RIRResponse): { message: string; type: 'success' | 'warning' | 'error' } {
  switch (rirResponse) {
    case 'yes_maybe':
      return {
        message: 'Perfect! That\'s 1 RIR. Keep it up!',
        type: 'success'
      };
    case 'yes_easily':
      return {
        message: 'Too easy! Push harder next set or increase weight.',
        type: 'warning'
      };
    case 'no_way':
      return {
        message: 'Complete failure - risky for joints. Stop at 1 RIR next time.',
        type: 'error'
      };
  }
}

