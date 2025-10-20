import { executeQuery } from './init';
import type { Exercise } from '../../types/database';

export function getAllExercises(): Exercise[] {
  return executeQuery<Exercise>('SELECT * FROM exercises ORDER BY name');
}

export function getExerciseById(id: number): Exercise | null {
  const results = executeQuery<Exercise>('SELECT * FROM exercises WHERE id = ?', [id]);
  return results[0] || null;
}

export function getDefaultExercises(): Exercise[] {
  return executeQuery<Exercise>(
    'SELECT * FROM exercises WHERE is_default_variation = 1 ORDER BY id'
  );
}

export function getExercisesByCategory(category: string): Exercise[] {
  return executeQuery<Exercise>(
    'SELECT * FROM exercises WHERE category = ? ORDER BY name',
    [category]
  );
}

