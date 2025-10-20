import { executeQuery, executeInsert, saveDatabase } from './init';
import type { WorkoutSet, RIRResponse } from '../../types/database';

export interface CreateSetData {
  workout_id: number;
  exercise_id: number;
  set_number: number;
  weight: number;
  reps: number;
  rir_response: RIRResponse;
  target_reps: number;
  is_warmup?: boolean;
}

export function createSet(data: CreateSetData): number {
  const sql = `
    INSERT INTO sets (
      workout_id, exercise_id, set_number, weight, reps, 
      rir_response, target_reps, is_warmup
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const setId = executeInsert(sql, [
    data.workout_id,
    data.exercise_id,
    data.set_number,
    data.weight,
    data.reps,
    data.rir_response,
    data.target_reps,
    data.is_warmup ? 1 : 0
  ]);
  
  saveDatabase();
  return setId;
}

export function getSetsByWorkout(workoutId: number): WorkoutSet[] {
  return executeQuery<WorkoutSet>(
    'SELECT * FROM sets WHERE workout_id = ? ORDER BY set_number',
    [workoutId]
  );
}

export function getSetsByExercise(exerciseId: number, limit: number = 50): WorkoutSet[] {
  return executeQuery<WorkoutSet>(
    `SELECT s.* FROM sets s
     JOIN workouts w ON s.workout_id = w.id
     WHERE s.exercise_id = ? AND s.is_warmup = 0
     ORDER BY w.date DESC, s.set_number
     LIMIT ?`,
    [exerciseId, limit]
  );
}

export function getLastWorkoutSets(exerciseId: number): WorkoutSet[] {
  const sql = `
    SELECT s.* FROM sets s
    JOIN workouts w ON s.workout_id = w.id
    WHERE s.exercise_id = ? AND s.is_warmup = 0
    ORDER BY w.date DESC, s.set_number
    LIMIT 10
  `;
  
  const allSets = executeQuery<WorkoutSet>(sql, [exerciseId]);
  
  if (allSets.length === 0) return [];
  
  // Get only sets from the most recent workout
  const lastWorkoutId = allSets[0].workout_id;
  return allSets.filter(set => set.workout_id === lastWorkoutId);
}

