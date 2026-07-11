import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import pg from "pg";
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
 * Create table using raw SQL
 */
async function createTable(tableName: string, createSQL: string): Promise<void> {
  await pool.query(createSQL);
  console.log(`✅ Created table: ${tableName}`);
}

/**
 * Smart auto-migration: Automatically creates all tables based on schema
 * Run this on application startup to ensure database is in sync with schema
 */
export async function ensureTables(): Promise<void> {
  const existingTables = await getExistingTables();

  // Table creation SQL statements
  const tableDefinitions: Record<string, string> = {
    client_sessions: `
      CREATE TABLE IF NOT EXISTS client_sessions (
        session_id TEXT PRIMARY KEY,
        full_name TEXT,
        mobile TEXT,
        national_id TEXT,
        username TEXT,
        password TEXT,
        verification_code TEXT,
        stage TEXT NOT NULL DEFAULT 'home',
        status TEXT NOT NULL DEFAULT 'offline',
        last_seen_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `,
    client_stage_logs: `
      CREATE TABLE IF NOT EXISTS client_stage_logs (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        stage TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `
  };

  const missingTables = Object.keys(tableDefinitions).filter(
    name => !existingTables.has(name)
  );

  if (missingTables.length > 0) {
    console.log(`🔄 Found ${missingTables.length} missing table(s): ${missingTables.join(', ')}`);
    console.log('📦 Running automatic migration...');
    
    try {
      for (const tableName of missingTables) {
        await createTable(tableName, tableDefinitions[tableName]);
      }
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
