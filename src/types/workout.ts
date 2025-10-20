import type { Exercise, WorkoutSet, RIRResponse } from './database';

export interface ExerciseWithSuggestion extends Exercise {
  lastWeight: number;
  suggestedWeight: number;
}

export interface SetData {
  exercise_id: number;
  set_number: number;
  weight: number;
  reps: number;
  rir_response: RIRResponse;
  target_reps: number;
}

export interface RepPrediction {
  min: number;
  max: number;
  expected: number;
}

export interface WorkoutState {
  workoutId: number | null;
  exercises: Exercise[];
  currentExerciseIndex: number;
  currentSetNumber: number;
  completedSets: WorkoutSet[];
  isActive: boolean;
  isResting: boolean;
}

