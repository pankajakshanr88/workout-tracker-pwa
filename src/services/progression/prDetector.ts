/**
 * Personal Record (PR) Detection Service
 * 
 * Automatically detects when a user hits a new PR and saves it to the database.
 * 
 * PR Types:
 * - weight_pr: Heaviest weight for any rep count
 * - volume_pr: Most total volume (weight × reps) in single set
 * - rep_pr: Most reps at a given weight
 */

import { executeQuery, executeInsert, saveDatabase } from '../database/init';
import type { PersonalRecord } from '../../types/database';

export interface PRCheck {
  isWeightPR: boolean;
  isVolumePR: boolean;
  isRepPR: boolean;
  previousWeightPR?: number;
  previousVolumePR?: number;
  previousRepPR?: number;
}

/**
 * Check if a completed set is a personal record
 */
export function checkForPR(
  exerciseId: number,
  weight: number,
  reps: number
): PRCheck {
  const volume = weight * reps;
  
  // Get all existing PRs for this exercise
  const existingPRs = executeQuery<PersonalRecord>(
    'SELECT * FROM personal_records WHERE exercise_id = ? ORDER BY date DESC',
    [exerciseId]
  );

  // Get the best records
  const weightPRs = existingPRs.filter(pr => pr.pr_type === 'weight_pr');
  const volumePRs = existingPRs.filter(pr => pr.pr_type === 'volume_pr');
  const repPRs = existingPRs.filter(pr => pr.pr_type === 'rep_pr' && pr.weight === weight);

  const currentWeightPR = weightPRs.length > 0 ? weightPRs[0].weight : 0;
  const currentVolumePR = volumePRs.length > 0 ? volumePRs[0].volume || 0 : 0;
  const currentRepPR = repPRs.length > 0 ? repPRs[0].reps : 0;

  return {
    isWeightPR: weight > currentWeightPR,
    isVolumePR: volume > currentVolumePR,
    isRepPR: reps > currentRepPR && repPRs.length > 0,
    previousWeightPR: currentWeightPR > 0 ? currentWeightPR : undefined,
    previousVolumePR: currentVolumePR > 0 ? currentVolumePR : undefined,
    previousRepPR: currentRepPR > 0 ? currentRepPR : undefined
  };
}

/**
 * Save a new personal record to the database
 */
export function savePR(
  exerciseId: number,
  workoutId: number,
  setId: number,
  prType: 'weight_pr' | 'volume_pr' | 'rep_pr',
  weight: number,
  reps: number
): number {
  const volume = weight * reps;
  
  const sql = `
    INSERT INTO personal_records (
      exercise_id, workout_id, set_id, pr_type,
      weight, reps, volume, date
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `;

  const prId = executeInsert(sql, [
    exerciseId,
    workoutId,
    setId,
    prType,
    weight,
    reps,
    volume
  ]);

  saveDatabase();
  return prId;
}

/**
 * Get all PRs for an exercise
 */
export function getExercisePRs(exerciseId: number): PersonalRecord[] {
  return executeQuery<PersonalRecord>(
    `SELECT * FROM personal_records 
     WHERE exercise_id = ? 
     ORDER BY date DESC`,
    [exerciseId]
  );
}

/**
 * Get the best PR of each type for an exercise
 */
export function getBestPRs(exerciseId: number): {
  weightPR?: PersonalRecord;
  volumePR?: PersonalRecord;
  repPR?: PersonalRecord;
} {
  const allPRs = getExercisePRs(exerciseId);

  const weightPR = allPRs
    .filter(pr => pr.pr_type === 'weight_pr')
    .sort((a, b) => b.weight - a.weight)[0];

  const volumePR = allPRs
    .filter(pr => pr.pr_type === 'volume_pr')
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))[0];

  const repPR = allPRs
    .filter(pr => pr.pr_type === 'rep_pr')
    .sort((a, b) => b.reps - a.reps)[0];

  return {
    weightPR,
    volumePR,
    repPR
  };
}

/**
 * Get all PRs across all exercises for display
 */
export function getAllPRs(): PersonalRecord[] {
  return executeQuery<PersonalRecord>(
    `SELECT pr.*, e.name as exercise_name
     FROM personal_records pr
     JOIN exercises e ON pr.exercise_id = e.id
     ORDER BY pr.date DESC
     LIMIT 50`,
    []
  );
}

/**
 * Check and auto-save PRs for a completed set
 * Returns the types of PRs achieved (if any)
 */
export function detectAndSavePRs(
  exerciseId: number,
  workoutId: number,
  setId: number,
  weight: number,
  reps: number
): string[] {
  const prCheck = checkForPR(exerciseId, weight, reps);
  const achievedPRs: string[] = [];

  if (prCheck.isWeightPR) {
    savePR(exerciseId, workoutId, setId, 'weight_pr', weight, reps);
    achievedPRs.push('weight');
  }

  if (prCheck.isVolumePR) {
    savePR(exerciseId, workoutId, setId, 'volume_pr', weight, reps);
    achievedPRs.push('volume');
  }

  if (prCheck.isRepPR) {
    savePR(exerciseId, workoutId, setId, 'rep_pr', weight, reps);
    achievedPRs.push('reps');
  }

  return achievedPRs;
}

