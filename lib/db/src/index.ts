import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { spawn } from "child_process";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";

/**
 * Check if a table exists in the database
 */
async function tableExists(tableName: string): Promise<boolean> {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `, [tableName]);
  return result.rows[0]?.exists ?? false;
}

/**
 * Get all existing tables in the database
 */
async function getExistingTables(): Promise<Set<string>> {
  const result = await pool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  return new Set(result.rows.map(row => row.table_name));
}

/**
 * Push schema to database using drizzle-kit
 * Creates all missing tables and columns automatically
 */
async function pushSchemaWithDrizzleKit(): Promise<void> {
  return new Promise((resolve, reject) => {
    const drizzleKit = spawn('npx', [
      'drizzle-kit', 'push',
      '--config', './lib/db/drizzle.config.ts',
      '--force' // Force push even if tables exist
    ], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env }
    });

    drizzleKit.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`drizzle-kit push exited with code ${code}`));
      }
    });

    drizzleKit.on('error', reject);
  });
}

/**
 * Smart auto-migration: Automatically creates all tables based on schema
 * Run this on application startup to ensure database is in sync with schema
 */
export async function ensureTables(): Promise<void> {
  const existingTables = await getExistingTables();
  const schemaTables = Object.values(schema).map(
    (table: any) => table?.constructor?.tableName || table?.table?.constructor?.name
  ).filter(Boolean);

  // Get actual table names from schema
  const tableNames = [
    'client_sessions',
    'client_stage_logs'
  ];

  const missingTables = tableNames.filter(name => !existingTables.has(name));

  if (missingTables.length > 0) {
    console.log(`🔄 Found ${missingTables.length} missing table(s): ${missingTables.join(', ')}`);
    console.log('📦 Running automatic migration...');
    
    try {
      await pushSchemaWithDrizzleKit();
      console.log('✅ Database migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  } else {
    console.log('✅ All tables already exist, no migration needed.');
  }
}

/**
 * Initialize database with automatic migration
 * Call this at application startup
 */
export async function initializeDatabase(): Promise<void> {
  console.log('🔍 Checking database schema...');
  await ensureTables();
}
