// Database types matching the SQL schema from spec

export interface Exercise {
  id: number;
  name: string;
  category: 'squat' | 'bench' | 'deadlift' | 'row' | 'press' | 'pull' | 'accessory';
  is_compound: boolean;
  is_default_variation: boolean;
  parent_exercise_id: number | null;
  description: string | null;
  created_at: string;
  // Template-specific properties (optional)
  superset_group?: string | null;
  order_index?: number;
}

export interface Workout {
  id: number;
  date: string; // ISO 8601 format: YYYY-MM-DD
  program_name: string | null;
  workout_type: string | null; // 'A', 'B', 'Push', 'Pull', 'Legs', etc.
  notes: string | null;
  duration_minutes: number | null;
  completed: boolean;
  created_at: string;
}

export type RIRResponse = 'yes_maybe' | 'yes_easily' | 'no_way';

export interface WorkoutSet {
  id: number;
  workout_id: number;
  exercise_id: number;
  set_number: number;
  weight: number;
  reps: number;
  rir_response: RIRResponse | null;
  target_reps: number | null;
  is_warmup: boolean;
  notes: string | null;
  created_at: string;
}

export interface PersonalRecord {
  id: number;
  exercise_id: number;
  workout_id: number | null;
  set_id: number | null;
  pr_type: 'weight_pr' | 'volume_pr' | 'rep_pr';
  weight: number;
  reps: number;
  volume: number | null;
  date: string;
  created_at: string;
  exercise_name?: string; // Joined from exercises table
}

export interface Setting {
  key: string;
  value: string;
}

// Workout Templates
export interface WorkoutTemplate {
  id: number;
  name: string; // e.g., "Workout A"
  is_active: boolean;
  created_at: string;
}

export interface WorkoutTemplateExercise {
  id: number;
  template_id: number;
  exercise_id: number;
  order_index: number;
  superset_group: string | null; // e.g., 'A' to pair A/B; null when not in superset
  created_at: string;
}

export type AlertType = 'stagnation' | 'sandbagging';
export type AlertSeverity = 'warning' | 'critical';

export interface Alert {
  id: number;
  exercise_id: number;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  is_dismissed: boolean;
  created_at: string;
  exercise_name?: string; // Joined from exercises table
}

export interface Program {
  id: number;
  name: string;
  description: string | null;
  duration_weeks: number | null;
  frequency_per_week: number | null;
  is_active: boolean;
  created_at: string;
}

// Exercise Library Types
export interface Equipment {
  id: number;
  name: string;
  normalized_name: string;
}

export interface Muscle {
  id: number;
  name: string;
  group_name: string | null;
}

export interface ExerciseTag {
  id: number;
  name: string;
}

export interface ExerciseMedia {
  id: number;
  exercise_id: number;
  type: 'video' | 'image';
  url: string;
  source: string | null;
  title: string | null;
}

