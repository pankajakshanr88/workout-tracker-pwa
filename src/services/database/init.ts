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

    // Create new library-related tables if they don't exist (idempotent)
    const libraryTables = [
      `CREATE TABLE IF NOT EXISTS muscles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        group_name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        normalized_name TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS exercise_muscles (
        exercise_id INTEGER NOT NULL,
        muscle_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id),
        FOREIGN KEY (muscle_id) REFERENCES muscles(id)
      );`,
      `CREATE TABLE IF NOT EXISTS exercise_equipment (
        exercise_id INTEGER NOT NULL,
        equipment_id INTEGER NOT NULL,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id),
        FOREIGN KEY (equipment_id) REFERENCES equipment(id)
      );`,
      `CREATE TABLE IF NOT EXISTS exercise_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS exercise_tag_map (
        exercise_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id),
        FOREIGN KEY (tag_id) REFERENCES exercise_tags(id)
      );`,
      `CREATE TABLE IF NOT EXISTS exercise_media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        url TEXT NOT NULL,
        source TEXT,
        title TEXT,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
      );`,
      `CREATE TABLE IF NOT EXISTS exercise_aliases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise_id INTEGER NOT NULL,
        alias TEXT NOT NULL,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
      );`
    ];

    for (const sql of libraryTables) {
      database.run(sql);
    }

    // Add is_custom column to exercises if missing
    const exInfo = database.exec("PRAGMA table_info(exercises);");
    if (exInfo.length > 0) {
      const exCols = exInfo[0].values.map((row: any[]) => row[1]);
      if (!exCols.includes('is_custom')) {
        database.run('ALTER TABLE exercises ADD COLUMN is_custom BOOLEAN DEFAULT 0');
      }
    }

    // Create helpful indexes if not exist
    const indexStatements = [
      `CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises(name);`,
      `CREATE INDEX IF NOT EXISTS idx_alias_alias ON exercise_aliases(alias);`,
      `CREATE INDEX IF NOT EXISTS idx_muscle_name ON muscles(name);`,
      `CREATE INDEX IF NOT EXISTS idx_equipment_name ON equipment(normalized_name);`,
      `CREATE INDEX IF NOT EXISTS idx_tag_name ON exercise_tags(name);`
    ];
    for (const sql of indexStatements) {
      database.run(sql);
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

    // Workout templates
    `CREATE TABLE IF NOT EXISTS workout_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,

    // Workout template exercises
    `CREATE TABLE IF NOT EXISTS workout_template_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      order_index INTEGER NOT NULL,
      superset_group TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES workout_templates(id),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_sets_workout ON sets(workout_id);`,
    `CREATE INDEX IF NOT EXISTS idx_sets_exercise ON sets(exercise_id);`,
    `CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);`,
    `CREATE INDEX IF NOT EXISTS idx_pr_exercise ON personal_records(exercise_id);`,
    `CREATE INDEX IF NOT EXISTS idx_alerts_exercise ON alerts(exercise_id);`,
    `CREATE INDEX IF NOT EXISTS idx_alerts_dismissed ON alerts(is_dismissed);`,
    `CREATE INDEX IF NOT EXISTS idx_template_exercises_template ON workout_template_exercises(template_id);`,
    `CREATE INDEX IF NOT EXISTS idx_template_exercises_order ON workout_template_exercises(order_index);`
  ];

  for (const sql of tables) {
    database.run(sql);
  }

  console.log('Database tables created successfully');
}

async function seedExercises(database: Database): Promise<void> {
  const exercises = [
    {
      name: 'Barbell Back Squat',
      category: 'squat',
      is_compound: true,
      is_default_variation: true,
      description: 'Primary lower body compound movement targeting quadriceps, glutes, and hamstrings'
    },
    {
      name: 'Barbell Front Squat',
      category: 'squat',
      is_compound: true,
      is_default_variation: false,
      description: 'Front-loaded squat variation emphasizing quadriceps and core'
    },
    {
      name: 'Goblet Squat',
      category: 'squat',
      is_compound: true,
      is_default_variation: false,
      description: 'Dumbbell squat variation good for beginners and warm-ups'
    },
    {
      name: 'Bulgarian Split Squat',
      category: 'squat',
      is_compound: true,
      is_default_variation: false,
      description: 'Single-leg squat variation for balance and unilateral strength'
    },
    {
      name: 'Box Squat',
      category: 'squat',
      is_compound: true,
      is_default_variation: false,
      description: 'Depth-controlled squat variation using a box'
    },
    {
      name: 'Pause Squat',
      category: 'squat',
      is_compound: true,
      is_default_variation: false,
      description: 'Squat variation with pause at bottom for technique and power'
    },
    {
      name: 'Lunges',
      category: 'squat',
      is_compound: true,
      is_default_variation: false,
      description: 'Single-leg lower body exercise'
    },
    {
      name: 'Step-ups',
      category: 'squat',
      is_compound: true,
      is_default_variation: false,
      description: 'Unilateral lower body movement'
    },
    {
      name: 'Leg Press',
      category: 'squat',
      is_compound: true,
      is_default_variation: false,
      description: 'Machine squat variation'
    },
    {
      name: 'Hack Squat',
      category: 'squat',
      is_compound: true,
      is_default_variation: false,
      description: 'Machine-guided squat movement'
    },
    {
      name: 'Smith Machine Squat',
      category: 'squat',
      is_compound: true,
      is_default_variation: false,
      description: 'Guided bar squat variation'
    },
    {
      name: 'Safety Bar Squat',
      category: 'squat',
      is_compound: true,
      is_default_variation: false,
      description: 'Neutral grip squat variation'
    },
    {
      name: 'Zercher Squat',
      category: 'squat',
      is_compound: true,
      is_default_variation: false,
      description: 'Front-loaded squat variation in elbows'
    },
    {
      name: 'Jefferson Squat',
      category: 'squat',
      is_compound: true,
      is_default_variation: false,
      description: 'Straddle stance squat variation'
    },
    {
      name: 'Barbell Bench Press',
      category: 'bench',
      is_compound: true,
      is_default_variation: true,
      description: 'Primary upper body pressing movement targeting chest, shoulders, and triceps'
    },
    {
      name: 'Incline Bench Press',
      category: 'bench',
      is_compound: true,
      is_default_variation: false,
      description: 'Upper chest focused bench press variation'
    },
    {
      name: 'Decline Bench Press',
      category: 'bench',
      is_compound: true,
      is_default_variation: false,
      description: 'Lower chest focused bench press variation'
    },
    {
      name: 'Close Grip Bench Press',
      category: 'bench',
      is_compound: true,
      is_default_variation: false,
      description: 'Tricep-focused bench press variation'
    },
    {
      name: 'Dumbbell Bench Press',
      category: 'bench',
      is_compound: true,
      is_default_variation: false,
      description: 'Dumbbell pressing movement with increased range of motion'
    },
    {
      name: 'Push-up',
      category: 'bench',
      is_compound: true,
      is_default_variation: false,
      description: 'Bodyweight pressing movement'
    },
    {
      name: 'Floor Press',
      category: 'bench',
      is_compound: true,
      is_default_variation: false,
      description: 'Partial range bench press from floor position'
    },
    {
      name: 'Dips',
      category: 'bench',
      is_compound: true,
      is_default_variation: false,
      description: 'Bodyweight pressing movement'
    },
    {
      name: 'Incline Dumbbell Press',
      category: 'bench',
      is_compound: true,
      is_default_variation: false,
      description: 'Upper chest dumbbell press'
    },
    {
      name: 'Incline Flyes',
      category: 'bench',
      is_compound: false,
      is_default_variation: false,
      description: 'Upper chest isolation exercise'
    },
    {
      name: 'Decline Flyes',
      category: 'bench',
      is_compound: false,
      is_default_variation: false,
      description: 'Lower chest isolation exercise'
    },
    {
      name: 'Pec Deck',
      category: 'bench',
      is_compound: false,
      is_default_variation: false,
      description: 'Machine chest isolation'
    },
    {
      name: 'Cable Flyes',
      category: 'bench',
      is_compound: false,
      is_default_variation: false,
      description: 'Cable chest isolation exercise'
    },
    {
      name: 'Conventional Deadlift',
      category: 'deadlift',
      is_compound: true,
      is_default_variation: true,
      description: 'Primary posterior chain movement targeting back, glutes, and hamstrings'
    },
    {
      name: 'Sumo Deadlift',
      category: 'deadlift',
      is_compound: true,
      is_default_variation: false,
      description: 'Wide-stance deadlift variation emphasizing inner thighs'
    },
    {
      name: 'Romanian Deadlift',
      category: 'deadlift',
      is_compound: true,
      is_default_variation: false,
      description: 'Hip-hinge focused deadlift for hamstring development'
    },
    {
      name: 'Trap Bar Deadlift',
      category: 'deadlift',
      is_compound: true,
      is_default_variation: false,
      description: 'Hex bar deadlift variation with neutral grip'
    },
    {
      name: 'Deficit Deadlift',
      category: 'deadlift',
      is_compound: true,
      is_default_variation: false,
      description: 'Deadlift variation from elevated platform for increased range'
    },
    {
      name: 'Deadlifts',
      category: 'deadlift',
      is_compound: true,
      is_default_variation: false,
      description: 'General deadlift category'
    },
    {
      name: 'Rack Pulls',
      category: 'deadlift',
      is_compound: true,
      is_default_variation: false,
      description: 'Partial range deadlift from rack'
    },
    {
      name: 'Block Pulls',
      category: 'deadlift',
      is_compound: true,
      is_default_variation: false,
      description: 'Elevated deadlift variation'
    },
    {
      name: 'Stiff Leg Deadlift',
      category: 'deadlift',
      is_compound: true,
      is_default_variation: false,
      description: 'Straight leg deadlift variation'
    },
    {
      name: 'Good Morning',
      category: 'deadlift',
      is_compound: true,
      is_default_variation: false,
      description: 'Hip hinge posterior chain exercise'
    },
    {
      name: 'Glute Bridge',
      category: 'deadlift',
      is_compound: true,
      is_default_variation: false,
      description: 'Bodyweight hip extension'
    },
    {
      name: 'Hip Thrust',
      category: 'deadlift',
      is_compound: true,
      is_default_variation: false,
      description: 'Glute-focused hip extension'
    },
    {
      name: 'Nordic Hamstring Curl',
      category: 'deadlift',
      is_compound: false,
      is_default_variation: false,
      description: 'Hamstring isolation exercise'
    },
    {
      name: 'Glute Kickbacks',
      category: 'deadlift',
      is_compound: false,
      is_default_variation: false,
      description: 'Glute isolation exercise'
    },
    {
      name: 'Reverse Hyperextensions',
      category: 'deadlift',
      is_compound: false,
      is_default_variation: false,
      description: 'Lower back and glute exercise'
    },
    {
      name: 'Barbell Row',
      category: 'row',
      is_compound: true,
      is_default_variation: true,
      description: 'Primary back pulling movement targeting lats and upper back'
    },
    {
      name: 'Dumbbell Row',
      category: 'row',
      is_compound: true,
      is_default_variation: false,
      description: 'Single-arm rowing movement for unilateral development'
    },
    {
      name: 'T-Bar Row',
      category: 'row',
      is_compound: true,
      is_default_variation: false,
      description: 'Machine-supported row variation for heavy loading'
    },
    {
      name: 'Seated Cable Row',
      category: 'row',
      is_compound: true,
      is_default_variation: false,
      description: 'Seated pulling movement with constant tension'
    },
    {
      name: 'Pendlay Row',
      category: 'row',
      is_compound: true,
      is_default_variation: false,
      description: 'Explosive rowing movement from floor'
    },
    {
      name: 'Meadows Row',
      category: 'row',
      is_compound: true,
      is_default_variation: false,
      description: 'Single-arm landmine row variation'
    },
    {
      name: 'Kroc Rows',
      category: 'row',
      is_compound: true,
      is_default_variation: false,
      description: 'Heavy single-arm rowing'
    },
    {
      name: 'Reverse Flyes',
      category: 'row',
      is_compound: false,
      is_default_variation: false,
      description: 'Posterior shoulder and upper back isolation'
    },
    {
      name: 'Cable Pullovers',
      category: 'row',
      is_compound: false,
      is_default_variation: false,
      description: 'Lat and chest stretch exercise'
    },
    {
      name: 'Cable Rows',
      category: 'row',
      is_compound: true,
      is_default_variation: false,
      description: 'Cable pulling exercise'
    },
    {
      name: 'One Arm Row',
      category: 'row',
      is_compound: true,
      is_default_variation: false,
      description: 'Unilateral rowing movement'
    },
    {
      name: 'Supinated Rows',
      category: 'row',
      is_compound: true,
      is_default_variation: false,
      description: 'Underhand grip rowing'
    },
    {
      name: 'Prone Rows',
      category: 'row',
      is_compound: true,
      is_default_variation: false,
      description: 'Incline bench rowing'
    },
    {
      name: 'Overhead Press',
      category: 'press',
      is_compound: true,
      is_default_variation: true,
      description: 'Primary shoulder pressing movement targeting deltoids and triceps'
    },
    {
      name: 'Seated Dumbbell Press',
      category: 'press',
      is_compound: true,
      is_default_variation: false,
      description: 'Seated shoulder press with dumbbells'
    },
    {
      name: 'Arnold Press',
      category: 'press',
      is_compound: true,
      is_default_variation: false,
      description: 'Rotational shoulder press variation'
    },
    {
      name: 'Push Press',
      category: 'press',
      is_compound: true,
      is_default_variation: false,
      description: 'Momentum-assisted overhead press'
    },
    {
      name: 'Z Press',
      category: 'press',
      is_compound: true,
      is_default_variation: false,
      description: 'Seated overhead press from floor'
    },
    {
      name: 'Seated Overhead Press',
      category: 'press',
      is_compound: true,
      is_default_variation: false,
      description: 'Seated barbell shoulder press'
    },
    {
      name: 'Viking Press',
      category: 'press',
      is_compound: true,
      is_default_variation: false,
      description: 'Neutral grip overhead press'
    },
    {
      name: 'Bradford Press',
      category: 'press',
      is_compound: true,
      is_default_variation: false,
      description: 'Behind the neck press variation'
    },
    {
      name: 'Military Press',
      category: 'press',
      is_compound: true,
      is_default_variation: false,
      description: 'Strict overhead press'
    },
    {
      name: 'Single Arm Dumbbell Press',
      category: 'press',
      is_compound: true,
      is_default_variation: false,
      description: 'Unilateral shoulder press'
    },
    {
      name: 'Landmine Press',
      category: 'press',
      is_compound: true,
      is_default_variation: false,
      description: 'Arc press movement'
    },
    {
      name: 'Pull-ups',
      category: 'pull',
      is_compound: true,
      is_default_variation: true,
      description: 'Bodyweight vertical pulling movement'
    },
    {
      name: 'Chin-ups',
      category: 'pull',
      is_compound: true,
      is_default_variation: false,
      description: 'Underhand grip vertical pulling'
    },
    {
      name: 'Lat Pulldowns',
      category: 'pull',
      is_compound: true,
      is_default_variation: false,
      description: 'Machine-assisted vertical pulling'
    },
    {
      name: 'Wide Grip Pull-ups',
      category: 'pull',
      is_compound: true,
      is_default_variation: false,
      description: 'Wide grip variation for lat emphasis'
    },
    {
      name: 'Neutral Grip Pull-ups',
      category: 'pull',
      is_compound: true,
      is_default_variation: false,
      description: 'Neutral grip vertical pulling'
    },
    {
      name: 'Assisted Pull-ups',
      category: 'pull',
      is_compound: true,
      is_default_variation: false,
      description: 'Machine-assisted vertical pulling'
    },
    {
      name: 'Commando Pull-ups',
      category: 'pull',
      is_compound: true,
      is_default_variation: false,
      description: 'Alternating grip pull-ups'
    },
    {
      name: 'Muscle-ups',
      category: 'pull',
      is_compound: true,
      is_default_variation: false,
      description: 'Advanced pull-up to dip transition'
    },
    {
      name: 'Australian Pull-ups',
      category: 'pull',
      is_compound: true,
      is_default_variation: false,
      description: 'Inverted row variation'
    },
    {
      name: 'Band Pull-aparts',
      category: 'pull',
      is_compound: false,
      is_default_variation: false,
      description: 'Shoulder blade activation exercise'
    },
    {
      name: 'Straight Arm Pulldowns',
      category: 'pull',
      is_compound: false,
      is_default_variation: false,
      description: 'Lat isolation exercise'
    },
    {
      name: 'Shrugs',
      category: 'pull',
      is_compound: false,
      is_default_variation: false,
      description: 'Upper trapezius exercise'
    },
    {
      name: 'Upright Rows',
      category: 'pull',
      is_compound: true,
      is_default_variation: false,
      description: 'Shoulder and trap compound movement'
    },
    {
      name: 'Barbell Curl',
      category: 'accessory',
      is_compound: false,
      is_default_variation: true,
      description: 'Primary bicep isolation exercise'
    },
    {
      name: 'Dumbbell Curl',
      category: 'accessory',
      is_compound: false,
      is_default_variation: false,
      description: 'Bicep isolation with dumbbells'
    },
    {
      name: 'Preacher Curl',
      category: 'accessory',
      is_compound: false,
      is_default_variation: false,
      description: 'Machine-assisted bicep curl'
    },
    {
      name: 'Hammer Curl',
      category: 'accessory',
      is_compound: false,
      is_default_variation: false,
      description: 'Neutral grip bicep and brachialis exercise'
    },
    {
      name: 'Cable Curl',
      category: 'accessory',
      is_compound: false,
      is_default_variation: false,
      description: 'Cable bicep isolation exercise'
    },
    {
      name: 'Tricep Extensions',
      category: 'accessory',
      is_compound: false,
      is_default_variation: true,
      description: 'Primary tricep isolation exercise'
    },
    {
      name: 'Overhead Tricep Extension',
      category: 'accessory',
      is_compound: false,
      is_default_variation: false,
      description: 'Overhead tricep isolation'
    },
    {
      name: 'Close Grip Push-ups',
      category: 'accessory',
      is_compound: false,
      is_default_variation: false,
      description: 'Bodyweight tricep exercise'
    },
    {
      name: 'Tricep Dips',
      category: 'accessory',
      is_compound: false,
      is_default_variation: false,
      description: 'Bodyweight tricep and chest exercise'
    },
    {
      name: 'Lateral Raises',
      category: 'accessory',
      is_compound: false,
      is_default_variation: true,
      description: 'Primary shoulder isolation exercise'
    },
    {
      name: 'Front Raises',
      category: 'accessory',
      is_compound: false,
      is_default_variation: false,
      description: 'Anterior deltoid isolation'
    },
    {
      name: 'Rear Delt Flyes',
      category: 'accessory',
      is_compound: false,
      is_default_variation: false,
      description: 'Posterior deltoid isolation'
    },
    {
      name: 'Shrugs',
      category: 'accessory',
      is_compound: false,
      is_default_variation: false,
      description: 'Trapezius isolation exercise'
    },
    {
      name: 'Face Pulls',
      category: 'accessory',
      is_compound: false,
      is_default_variation: false,
      description: 'Posterior shoulder and upper back exercise'
    },
    {
      name: 'Calf Raises',
      category: 'accessory',
      is_compound: false,
      is_default_variation: true,
      description: 'Primary lower leg isolation exercise'
    },
    {
      name: 'Seated Calf Raises',
      category: 'accessory',
      is_compound: false,
      is_default_variation: false,
      description: 'Seated lower leg isolation'
    },
    {
      name: 'Donkey Calf Raises',
      category: 'accessory',
      is_compound: false,
      is_default_variation: false,
      description: 'Bodyweight calf exercise'
    },
    {
      name: 'Plank',
      category: 'accessory',
      is_compound: false,
      is_default_variation: true,
      description: 'Core stabilization exercise'
    },
    {
      name: 'Russian Twists',
      category: 'accessory',
      is_compound: false,
      is_default_variation: false,
      description: 'Oblique core exercise'
    },
    {
      name: 'Dead Bug',
      category: 'accessory',
      is_compound: false,
      is_default_variation: false,
      description: 'Core stability and coordination exercise'
    },
    {
      name: 'Leg Raises',
      category: 'accessory',
      is_compound: false,
      is_default_variation: false,
      description: 'Lower abdominal exercise'
    },
    {
      name: 'Farmer\'s Walk',
      category: 'accessory',
      is_compound: false,
      is_default_variation: false,
      description: 'Full body carrying exercise'
    },
    {
      name: 'Kettlebell Swing',
      category: 'accessory',
      is_compound: true,
      is_default_variation: false,
      description: 'Explosive hip hinge movement'
    },
  ];

  const stmt = database.prepare(
    `INSERT INTO exercises (name, category, is_compound, is_default_variation, parent_exercise_id, description)
     VALUES (?, ?, ?, ?, NULL, ?)`
  );

  for (const ex of exercises) {
    stmt.run([ex.name, ex.category, ex.is_compound, ex.is_default_variation, ex.description]);
  }

  stmt.free();
  console.log(`${exercises.length} comprehensive exercises seeded`);
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

/**
 * Reset database - useful for fixing data issues
 */
export async function resetDatabase(): Promise<void> {
  if (idbConnection) {
    await idbConnection.clear('database');
  }

  // Reinitialize
  db = null;
  idbConnection = null;

  console.log('Database reset complete - refresh page to reinitialize');
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

