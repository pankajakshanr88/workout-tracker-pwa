import { executeQuery, executeInsert, executeUpdate } from './init';
import type { Exercise, WorkoutTemplate, WorkoutTemplateExercise, Equipment, Muscle, ExerciseTag } from '../../types/database';

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

// -----------------------------
// Exercise Library helpers
// -----------------------------

export function upsertEquipment(name: string): number {
  const normalized = name.trim().toLowerCase();
  const existing = executeQuery<Equipment>('SELECT * FROM equipment WHERE normalized_name = ?', [normalized]);
  if (existing.length > 0) return existing[0].id;
  return executeInsert('INSERT INTO equipment (name, normalized_name) VALUES (?, ?)', [name.trim(), normalized]);
}

export function upsertMuscle(name: string, group: string | null = null): number {
  const existing = executeQuery<Muscle>('SELECT * FROM muscles WHERE name = ?', [name.trim()]);
  if (existing.length > 0) return existing[0].id;
  return executeInsert('INSERT INTO muscles (name, group_name) VALUES (?, ?)', [name.trim(), group]);
}

export function upsertTag(name: string): number {
  const existing = executeQuery<ExerciseTag>('SELECT * FROM exercise_tags WHERE name = ?', [name.trim().toLowerCase()]);
  if (existing.length > 0) return existing[0].id;
  return executeInsert('INSERT INTO exercise_tags (name) VALUES (?)', [name.trim().toLowerCase()]);
}

export function linkEquipment(exerciseId: number, equipmentNames: string[]): void {
  executeUpdate('DELETE FROM exercise_equipment WHERE exercise_id = ?', [exerciseId]);
  for (const eq of equipmentNames) {
    const eqId = upsertEquipment(eq);
    executeInsert('INSERT INTO exercise_equipment (exercise_id, equipment_id) VALUES (?, ?)', [exerciseId, eqId]);
  }
}

export function linkMuscles(exerciseId: number, primary: string[], secondary: string[]): void {
  executeUpdate('DELETE FROM exercise_muscles WHERE exercise_id = ?', [exerciseId]);
  for (const m of primary) {
    const id = upsertMuscle(m, null);
    executeInsert('INSERT INTO exercise_muscles (exercise_id, muscle_id, role) VALUES (?, ?, ?)', [exerciseId, id, 'primary']);
  }
  for (const m of secondary) {
    const id = upsertMuscle(m, null);
    executeInsert('INSERT INTO exercise_muscles (exercise_id, muscle_id, role) VALUES (?, ?, ?)', [exerciseId, id, 'secondary']);
  }
}

export function linkTags(exerciseId: number, tags: string[]): void {
  executeUpdate('DELETE FROM exercise_tag_map WHERE exercise_id = ?', [exerciseId]);
  for (const t of tags) {
    const id = upsertTag(t);
    executeInsert('INSERT INTO exercise_tag_map (exercise_id, tag_id) VALUES (?, ?)', [exerciseId, id]);
  }
}

export function addAliases(exerciseId: number, aliases: string[]): void {
  for (const a of aliases) {
    executeInsert('INSERT INTO exercise_aliases (exercise_id, alias) VALUES (?, ?)', [exerciseId, a.trim().toLowerCase()]);
  }
}

export function addMedia(exerciseId: number, videoUrl?: string | null, imageUrl?: string | null): void {
  if (videoUrl) {
    executeInsert('INSERT INTO exercise_media (exercise_id, type, url, source, title) VALUES (?, ?, ?, ?, ?)', [exerciseId, 'video', videoUrl, 'youtube', null]);
  }
  if (imageUrl) {
    executeInsert('INSERT INTO exercise_media (exercise_id, type, url, source, title) VALUES (?, ?, ?, ?, ?)', [exerciseId, 'image', imageUrl, 'external', null]);
  }
}

export function findExerciseByNameOrAlias(name: string): Exercise | null {
  const n = name.trim().toLowerCase();
  const byName = executeQuery<Exercise>('SELECT * FROM exercises WHERE LOWER(name) = ?', [n]);
  if (byName.length > 0) return byName[0] || null;
  const byAlias = executeQuery<Exercise>(
    `SELECT e.* FROM exercise_aliases a JOIN exercises e ON e.id = a.exercise_id WHERE a.alias = ? LIMIT 1`,
    [n]
  );
  return byAlias[0] || null;
}

export function upsertExercise(payload: {
  name: string;
  category: string;
  is_compound?: boolean;
  description?: string | null;
  primary_muscles?: string[];
  secondary_muscles?: string[];
  equipment?: string[];
  tags?: string[];
  aliases?: string[];
  video_url?: string | null;
  image_url?: string | null;
  is_custom?: boolean;
}): number {
  const existing = findExerciseByNameOrAlias(payload.name);
  let exerciseId: number;
  if (existing) {
    executeUpdate('UPDATE exercises SET category = ?, is_compound = ?, description = ?, is_custom = COALESCE(is_custom, ?) WHERE id = ?', [
      payload.category,
      payload.is_compound ?? 1,
      payload.description ?? null,
      payload.is_custom ? 1 : 0,
      (existing as any).id
    ]);
    exerciseId = (existing as any).id;
  } else {
    exerciseId = executeInsert(
      'INSERT INTO exercises (name, category, is_compound, description, is_custom) VALUES (?, ?, ?, ?, ?)',
      [payload.name.trim(), payload.category, payload.is_compound ?? 1, payload.description ?? null, payload.is_custom ? 1 : 0]
    );
  }

  if (payload.primary_muscles || payload.secondary_muscles) {
    linkMuscles(exerciseId, payload.primary_muscles || [], payload.secondary_muscles || []);
  }
  if (payload.equipment) linkEquipment(exerciseId, payload.equipment);
  if (payload.tags) linkTags(exerciseId, payload.tags);
  if (payload.aliases) addAliases(exerciseId, payload.aliases);
  if (payload.video_url || payload.image_url) addMedia(exerciseId, payload.video_url, payload.image_url);

  return exerciseId;
}

// Template helpers
export function getTemplates(): WorkoutTemplate[] {
  return executeQuery<WorkoutTemplate>('SELECT * FROM workout_templates ORDER BY id');
}

export function createTemplate(name: string): number {
  return executeInsert('INSERT INTO workout_templates (name, is_active) VALUES (?, 0)', [name]);
}

export function setActiveTemplate(templateId: number): void {
  executeUpdate('UPDATE workout_templates SET is_active = 0');
  executeUpdate('UPDATE workout_templates SET is_active = 1 WHERE id = ?', [templateId]);
}

export function getActiveTemplate(): WorkoutTemplate | null {
  const rows = executeQuery<WorkoutTemplate>('SELECT * FROM workout_templates WHERE is_active = 1 LIMIT 1');
  return rows[0] || null;
}

export function getTemplateExercises(templateId: number): WorkoutTemplateExercise[] {
  return executeQuery<WorkoutTemplateExercise>(
    'SELECT * FROM workout_template_exercises WHERE template_id = ? ORDER BY order_index',
    [templateId]
  );
}

export function saveTemplateExercises(templateId: number, items: { exercise_id: number; order_index: number; superset_group: string | null; }[]): void {
  // Clear and insert fresh ordering to keep it simple
  executeUpdate('DELETE FROM workout_template_exercises WHERE template_id = ?', [templateId]);
  for (const item of items) {
    executeInsert(
      'INSERT INTO workout_template_exercises (template_id, exercise_id, order_index, superset_group) VALUES (?, ?, ?, ?)',
      [templateId, item.exercise_id, item.order_index, item.superset_group]
    );
  }
}

export function getTemplateExercisesWithDetails(templateId: number): (Exercise & { superset_group: string | null; order_index: number })[] {
  return executeQuery<Exercise & { superset_group: string | null; order_index: number }>(
    `SELECT e.*, wte.superset_group, wte.order_index
     FROM exercises e
     JOIN workout_template_exercises wte ON e.id = wte.exercise_id
     WHERE wte.template_id = ?
     ORDER BY wte.order_index`,
    [templateId]
  );
}

