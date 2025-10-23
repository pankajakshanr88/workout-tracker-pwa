import { create } from 'zustand';
import type { Exercise, WorkoutSet, RIRResponse } from '../types/database';
import { createWorkout, completeWorkout } from '../services/database/workouts';
import { createSet } from '../services/database/sets';

interface WorkoutState {
  // Current workout state
  workoutId: number | null;
  exercises: Exercise[];
  currentExerciseIndex: number;
  currentSetNumber: number;
  completedSets: WorkoutSet[];
  isActive: boolean;
  isResting: boolean;
  startTime: Date | null;

  // Last completed set data for rest screen
  lastCompletedSet: WorkoutSet | null;

  // Actions
  startWorkout: (exercises: Exercise[]) => void;
  completeSet: (weight: number, reps: number, rirResponse: RIRResponse, targetReps: number) => { workoutId: number; setId: number };
  startRest: () => void;
  endRest: () => void;
  nextExercise: () => void;
  endWorkout: () => void;
  discardWorkout: () => void;
  resetWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workoutId: null,
  exercises: [],
  currentExerciseIndex: 0,
  currentSetNumber: 1,
  completedSets: [],
  isActive: false,
  isResting: false,
  startTime: null,
  lastCompletedSet: null,

  startWorkout: (exercises: Exercise[]) => {
    const today = new Date().toISOString().split('T')[0];
    const workoutId = createWorkout(today, 'StrongLifts 5×5', 'A');

    set({
      workoutId,
      exercises,
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      completedSets: [],
      isActive: true,
      isResting: false,
      startTime: new Date(),
      lastCompletedSet: null
    });
  },

  completeSet: (weight: number, reps: number, rirResponse: RIRResponse, targetReps: number) => {
    const { workoutId, exercises, currentExerciseIndex, currentSetNumber, completedSets } = get();

    if (!workoutId) return { workoutId: 0, setId: 0 };

    const currentExercise = exercises[currentExerciseIndex];

    // Save set to database
    const setId = createSet({
      workout_id: workoutId,
      exercise_id: currentExercise.id,
      set_number: currentSetNumber,
      weight,
      reps,
      rir_response: rirResponse,
      target_reps: targetReps,
      is_warmup: false
    });

    // Create set object for state
    const newSet: WorkoutSet = {
      id: setId,
      workout_id: workoutId,
      exercise_id: currentExercise.id,
      set_number: currentSetNumber,
      weight,
      reps,
      rir_response: rirResponse,
      target_reps: targetReps,
      is_warmup: false,
      notes: null,
      created_at: new Date().toISOString()
    };

    set({
      completedSets: [...completedSets, newSet],
      lastCompletedSet: newSet
    });

    return { workoutId, setId };
  },

  startRest: () => {
    set({ isResting: true });
  },

  endRest: () => {
    const { currentSetNumber } = get();
    set({
      isResting: false,
      currentSetNumber: currentSetNumber + 1
    });
  },

  nextExercise: () => {
    const { currentExerciseIndex, exercises } = get();

    if (currentExerciseIndex < exercises.length - 1) {
      set({
        currentExerciseIndex: currentExerciseIndex + 1,
        currentSetNumber: 1,
        isResting: false
      });
    } else {
      // All exercises complete
      get().endWorkout();
    }
  },

  endWorkout: () => {
    const { workoutId, startTime } = get();

    if (workoutId && startTime) {
      const durationMinutes = Math.round((Date.now() - startTime.getTime()) / 60000);
      completeWorkout(workoutId, durationMinutes);
    }

    set({
      workoutId: null,
      exercises: [],
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      completedSets: [],
      isActive: false,
      isResting: false,
      startTime: null,
      lastCompletedSet: null
    });
  },

  discardWorkout: () => {
    // Discard workout without saving - just reset state
    set({
      workoutId: null,
      exercises: [],
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      completedSets: [],
      isActive: false,
      isResting: false,
      startTime: null,
      lastCompletedSet: null
    });
  },

  resetWorkout: () => {
    set({
      workoutId: null,
      exercises: [],
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      completedSets: [],
      isActive: false,
      isResting: false,
      startTime: null,
      lastCompletedSet: null
    });
  }
}));

