// @ts-ignore - sql.js doesn't have types
import initSqlJs from 'sql.js';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

type Database = any;

interface WorkoutDB extends DBSchema {
  database: {
    key: string;
    value: Uint8Array;
  };
}

let db: Database | null = null;
let idbConnection: IDBPDatabase<WorkoutDB> | null = null;

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  try {
    // Load SQLite WASM module
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    });

    // Open IndexedDB for persistence
    idbConnection = await openDB<WorkoutDB>('workout-tracker', 1, {
      upgrade(db) {
        db.createObjectStore('database');
      }
    });

    // Try to load existing database
    const savedDb = await idbConnection.get('database', 'sqlite');

    if (savedDb) {
      console.log('Loading existing database from IndexedDB');
      db = new SQL.Database(savedDb);
      
      // Run migrations for schema updates
      await runMigrations(db);
    } else {
      console.log('Creating new database');
      db = new SQL.Database();
      await createTables(db);
      await seedExercises(db);
      await saveDatabase();
    }

    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

async function runMigrations(database: Database): Promise<void> {
  console.log('Running database migrations...');
  
  try {
    // Check if personal_records table has new columns
    const tableInfo = database.exec("PRAGMA table_info(personal_records);");
    
    if (tableInfo.length > 0) {
      const columns = tableInfo[0].values.map((row: any[]) => row[1]); // column name is at index 1
      
      // Check if we need to migrate (missing pr_type, set_id, or volume columns)
      const needsMigration = !columns.includes('pr_type') || 
                             !columns.includes('set_id') || 
                             !columns.includes('volume');
      
      if (needsMigration) {
        console.log('Migrating personal_records table to new schema...');
        
        // Drop old table (it's okay, PRs are likely empty at this point)
        database.run('DROP TABLE IF EXISTS personal_records;');
        
        // Recreate with new schema
        database.run(`CREATE TABLE personal_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          exercise_id INTEGER NOT NULL,
          workout_id INTEGER,
          set_id INTEGER,
          pr_type TEXT NOT NULL,
          weight REAL NOT NULL,
          reps INTEGER NOT NULL,
          volume REAL,
          date TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (exercise_id) REFERENCES exercises(id),
          FOREIGN KEY (workout_id) REFERENCES workouts(id),
          FOREIGN KEY (set_id) REFERENCES sets(id)
        );`);
        
        console.log('Migration complete!');
        await saveDatabase();
      } else {
        console.log('Database schema is up to date');
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
    // Don't throw - allow app to continue with existing schema
  }
}

async function createTables(database: Database): Promise<void> {
  const tables = [
    // Exercises table
    `CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      is_compound BOOLEAN DEFAULT 1,
      is_default_variation BOOLEAN DEFAULT 0,
      parent_exercise_id INTEGER,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_exercise_id) REFERENCES exercises(id)
    );`,

    // Workouts table
    `CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      program_name TEXT,
      workout_type TEXT,
      notes TEXT,
      duration_minutes INTEGER,
      completed BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,

    // Sets table
    `CREATE TABLE IF NOT EXISTS sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      rir_response TEXT,
      target_reps INTEGER,
      is_warmup BOOLEAN DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );`,

    // Personal Records table
    `CREATE TABLE IF NOT EXISTS personal_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL,
      workout_id INTEGER,
      set_id INTEGER,
      pr_type TEXT NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      volume REAL,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id),
      FOREIGN KEY (workout_id) REFERENCES workouts(id),
      FOREIGN KEY (set_id) REFERENCES sets(id)
    );`,

    // Settings table
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );`,

    // Alerts table
    `CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      is_dismissed BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );`,

    // Programs table
    `CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      duration_weeks INTEGER,
      frequency_per_week INTEGER,
      is_active BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_sets_workout ON sets(workout_id);`,
    `CREATE INDEX IF NOT EXISTS idx_sets_exercise ON sets(exercise_id);`,
    `CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);`,
    `CREATE INDEX IF NOT EXISTS idx_pr_exercise ON personal_records(exercise_id);`,
    `CREATE INDEX IF NOT EXISTS idx_alerts_exercise ON alerts(exercise_id);`,
    `CREATE INDEX IF NOT EXISTS idx_alerts_dismissed ON alerts(is_dismissed);`
  ];

  for (const sql of tables) {
    database.run(sql);
  }

  console.log('Database tables created successfully');
}

async function seedExercises(database: Database): Promise<void> {
  const exercises = [
    { name: 'Barbell Back Squat', category: 'squat', is_compound: 1, is_default: 1 },
    { name: 'Barbell Bench Press', category: 'bench', is_compound: 1, is_default: 1 },
    { name: 'Conventional Deadlift', category: 'deadlift', is_compound: 1, is_default: 1 },
    { name: 'Barbell Row', category: 'row', is_compound: 1, is_default: 1 },
    { name: 'Overhead Press', category: 'press', is_compound: 1, is_default: 1 },
  ];

  const stmt = database.prepare(
    `INSERT INTO exercises (name, category, is_compound, is_default_variation, parent_exercise_id)
     VALUES (?, ?, ?, ?, NULL)`
  );

  for (const ex of exercises) {
    stmt.run([ex.name, ex.category, ex.is_compound, ex.is_default]);
  }

  stmt.free();
  console.log('Default exercises seeded');
}

export async function saveDatabase(): Promise<void> {
  if (!db || !idbConnection) return;

  try {
    const data = db.export();
    await idbConnection.put('database', data, 'sqlite');
    console.log('Database saved to IndexedDB');
  } catch (error) {
    console.error('Failed to save database:', error);
  }
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function executeQuery<T>(sql: string, params: any[] = []): T[] {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  stmt.bind(params);

  const results: T[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as T;
    results.push(row);
  }

  stmt.free();
  return results;
}

export function executeInsert(sql: string, params: any[] = []): number {
  const database = getDatabase();
  database.run(sql, params);
  
  // Get last insert ID
  const result = database.exec('SELECT last_insert_rowid() as id');
  return result[0].values[0][0] as number;
}

export function executeUpdate(sql: string, params: any[] = []): void {
  const database = getDatabase();
  database.run(sql, params);
}

