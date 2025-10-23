import { Alert, AlertType } from '../../types/database';
import { executeQuery } from './init';

/**
 * Create alerts table if it doesn't exist
 */
export function createAlertsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      is_dismissed BOOLEAN DEFAULT FALSE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exercise_id) REFERENCES exercises (id)
    );
  `;

  return executeQuery(query);
}

/**
 * Create a new alert
 */
export function createAlert(
  exerciseId: number,
  alertType: AlertType,
  severity: string,
  message: string
): number {
  const query = `
    INSERT INTO alerts (exercise_id, alert_type, severity, message, is_dismissed, created_at)
    VALUES (?, ?, ?, ?, FALSE, datetime('now'))
  `;

  const result = executeQuery(query, [exerciseId, alertType, severity, message]);
  return typeof result === 'number' ? result : 0;
}

/**
 * Get all active (non-dismissed) alerts
 */
export function getActiveAlerts(): Alert[] {
  const query = `
    SELECT
      a.*,
      e.name as exercise_name
    FROM alerts a
    LEFT JOIN exercises e ON a.exercise_id = e.id
    WHERE a.is_dismissed = FALSE
    ORDER BY a.created_at DESC
  `;

  const results = executeQuery(query);
  return results.map((row: any) => ({
    id: row.id,
    exercise_id: row.exercise_id,
    alert_type: row.alert_type,
    severity: row.severity as 'warning' | 'critical',
    message: row.message,
    is_dismissed: row.is_dismissed,
    created_at: row.created_at,
    exercise_name: row.exercise_name
  })) as Alert[];
}

/**
 * Get alerts for a specific exercise
 */
export function getAlertsForExercise(exerciseId: number): Alert[] {
  const query = `
    SELECT a.*, e.name as exercise_name FROM alerts a
    LEFT JOIN exercises e ON a.exercise_id = e.id
    WHERE a.exercise_id = ? AND a.is_dismissed = FALSE
    ORDER BY a.created_at DESC
  `;

  const results = executeQuery(query, [exerciseId]);
  return results.map((row: any) => ({
    id: row.id,
    exercise_id: row.exercise_id,
    alert_type: row.alert_type,
    severity: row.severity as 'warning' | 'critical',
    message: row.message,
    is_dismissed: row.is_dismissed,
    created_at: row.created_at,
    exercise_name: row.exercise_name
  })) as Alert[];
}

/**
 * Dismiss an alert
 */
export function dismissAlert(alertId: number): void {
  const query = `
    UPDATE alerts
    SET is_dismissed = TRUE
    WHERE id = ?
  `;

  executeQuery(query, [alertId]);
}

/**
 * Delete old dismissed alerts (cleanup)
 */
export function cleanupOldAlerts(daysToKeep: number = 30): void {
  const query = `
    DELETE FROM alerts
    WHERE is_dismissed = TRUE
    AND created_at < datetime('now', '-${daysToKeep} days')
  `;

  executeQuery(query);
}

/**
 * Check if an alert already exists for the same exercise and type
 */
export function hasExistingAlert(exerciseId: number, alertType: AlertType): boolean {
  const query = `
    SELECT COUNT(*) as count FROM alerts
    WHERE exercise_id = ? AND alert_type = ? AND is_dismissed = FALSE
  `;

  const result = executeQuery(query, [exerciseId, alertType]);
  return (result[0] as any)?.count > 0 || false;
}
