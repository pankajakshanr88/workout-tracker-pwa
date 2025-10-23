// Test-only E2E bridge to seed/reset data from Playwright
// Attached to window when VITE_E2E === '1'
import { saveDatabase } from '../services/database/init';
import { createWorkout } from '../services/database/workouts';
import { createSet } from '../services/database/sets';
import { savePR } from '../services/progression/prDetector';
import { getDefaultExercises } from '../services/database/exercises';

// Safe versions that don't throw if DB not ready
function safeGetDefaults() {
  try {
    return getDefaultExercises();
  } catch (e) {
    console.error('Error getting defaults:', e);
    return [
      { id: 1, name: 'Barbell Back Squat', category: 'squat', is_compound: 1, is_default_variation: 1 },
      { id: 2, name: 'Barbell Bench Press', category: 'bench', is_compound: 1, is_default_variation: 1 },
      { id: 3, name: 'Conventional Deadlift', category: 'deadlift', is_compound: 1, is_default_variation: 1 },
      { id: 4, name: 'Barbell Row', category: 'row', is_compound: 1, is_default_variation: 1 },
      { id: 5, name: 'Overhead Press', category: 'press', is_compound: 1, is_default_variation: 1 }
    ];
  }
}

type RIR = 'yes_maybe' | 'yes_easily' | 'no_way';

export function attachE2EBridge() {
  if (import.meta.env.VITE_E2E !== '1') return;
  const w = window as any;
  if (w.__e2e) return; // idempotent

  w.__e2e = {
    resetDb: async () => {
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('workout-tracker');
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
    },
    defaults: () => safeGetDefaults(),
    workoutWithSets: (
      date: string,
      exerciseId: number,
      sets: { weight: number; reps: number; rir: RIR }[]
    ) => {
      try {
        // Check if database is ready by checking if createWorkout is available
        if (typeof createWorkout !== 'function') {
          console.warn('Database not ready, skipping workout creation');
          return { workoutId: 0, lastSetId: 0 };
        }

        const workoutId = createWorkout(date, 'E2E', 'A');
        let setNum = 1;
        let lastSetId = 0;
        for (const s of sets) {
          lastSetId = createSet({
            workout_id: workoutId,
            exercise_id: exerciseId,
            set_number: setNum++,
            weight: s.weight,
            reps: s.reps,
            rir_response: s.rir,
            target_reps: 5,
            is_warmup: false
          });
        }
        saveDatabase();
        return { workoutId, lastSetId };
      } catch (e) {
        console.error('Error creating workout with sets:', e);
        return { workoutId: 0, lastSetId: 0 };
      }
    },
    seedSameWeightWorkouts: (
      exerciseId: number,
      dates: string[],
      weight: number,
      repsPerWorkout: number[][]
    ) => {
      try {
        dates.forEach((d, i) => {
          const reps = repsPerWorkout[i] ?? [5, 5, 5, 5, 5];
          w.__e2e.workoutWithSets(
            d,
            exerciseId,
            reps.map((r: number) => ({ weight, reps: r, rir: 'yes_maybe' }))
          );
        });
      } catch (e) {
        console.error('Error seeding same weight workouts:', e);
      }
    },
    seedFlatReps: (exerciseId: number, dates: string[], weight: number, reps: number) => {
      try {
        dates.forEach((d: string) =>
          w.__e2e.workoutWithSets(
            d,
            exerciseId,
            Array.from({ length: 5 }, () => ({ weight, reps, rir: 'yes_maybe' }))
          )
        );
      } catch (e) {
        console.error('Error seeding flat reps:', e);
      }
    },
    savePR
  };
}


