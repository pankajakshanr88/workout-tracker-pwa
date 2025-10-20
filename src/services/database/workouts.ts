import { executeQuery, executeInsert, saveDatabase } from './init';
import type { Workout } from '../../types/database';

export function createWorkout(date: string, programName?: string, workoutType?: string): number {
  const sql = `
    INSERT INTO workouts (date, program_name, workout_type, completed)
    VALUES (?, ?, ?, 0)
  `;
  const workoutId = executeInsert(sql, [date, programName || null, workoutType || null]);
  saveDatabase();
  return workoutId;
}

export function getWorkoutById(id: number): Workout | null {
  const results = executeQuery<Workout>('SELECT * FROM workouts WHERE id = ?', [id]);
  return results[0] || null;
}

export function getTodayWorkout(): Workout | null {
  const today = new Date().toISOString().split('T')[0];
  const results = executeQuery<Workout>(
    'SELECT * FROM workouts WHERE date = ? ORDER BY created_at DESC LIMIT 1',
    [today]
  );
  return results[0] || null;
}

export function getRecentWorkouts(limit: number = 10): Workout[] {
  return executeQuery<Workout>(
    'SELECT * FROM workouts ORDER BY date DESC, created_at DESC LIMIT ?',
    [limit]
  );
}

export function completeWorkout(workoutId: number, durationMinutes?: number): void {
  const sql = `
    UPDATE workouts 
    SET completed = 1, duration_minutes = ?
    WHERE id = ?
  `;
  executeQuery(sql, [durationMinutes || null, workoutId]);
  saveDatabase();
}

