import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Optimize connection pool for serverless (Neon PostgreSQL)
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Neon recommends these settings for serverless
  max: 5,  // Reduced for serverless environments
  idleTimeoutMillis: 10000,  // 10 seconds (Neon terminates idle connections after ~5 min)
  connectionTimeoutMillis: 10000,  // 10 second connection timeout
  statement_timeout: 15000,  // 15 second query timeout
});

// Log pool events for debugging
pool.on('error', (err) => {
  console.error('❌ Unexpected pool error:', err.message);
});

pool.on('connect', () => {
  console.log('🔌 New database connection established');
});

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
    `,
    admin_users: `
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        is_super_admin BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `,
    admin_devices: `
      CREATE TABLE IF NOT EXISTS admin_devices (
        id SERIAL PRIMARY KEY,
        device_id TEXT NOT NULL UNIQUE,
        device_name TEXT NOT NULL,
        device_type TEXT,
        last_ip TEXT,
        last_used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `,
    watches: `
      CREATE TABLE IF NOT EXISTS watches (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        description TEXT,
        description_ar TEXT,
        color_id TEXT NOT NULL UNIQUE,
        color_name TEXT NOT NULL,
        color_hex TEXT,
        image_url TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `,
    site_settings: `
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `
  };

  // Delete incorrect tables (indices created as tables)
  const incorrectTables = ['watches_active_idx', 'watches_order_idx', 'devices_last_used_idx'];
  for (const tableName of incorrectTables) {
    if (existingTables.has(tableName)) {
      try {
        await pool.query(`DROP TABLE IF EXISTS ${tableName}`);
        console.log(`🗑️ Deleted incorrect table: ${tableName}`);
      } catch (e) {
        console.error(`Failed to delete ${tableName}:`, e);
      }
    }
  }

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

  // Create indices (ignore errors if they already exist)
  const indices = [
    'CREATE INDEX IF NOT EXISTS watches_is_active_idx ON watches (is_active)',
    'CREATE INDEX IF NOT EXISTS watches_display_order_idx ON watches (display_order)',
    'CREATE INDEX IF NOT EXISTS devices_last_used_idx ON admin_devices (last_used_at)',
  ];

  for (const idx of indices) {
    try {
      await pool.query(idx);
    } catch (e) {
      // Index may already exist, ignore
    }
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
