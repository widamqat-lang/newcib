import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL not set');
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('❌ Pool error:', err.message);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
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
        email TEXT NOT NULL UNIQUE,
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
    `,
    blocked_devices: `
      CREATE TABLE IF NOT EXISTS blocked_devices (
        id SERIAL PRIMARY KEY,
        device_id TEXT NOT NULL UNIQUE,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        blocked_until TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `,
    conversations: `
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        client_session_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        agent_connected_at TIMESTAMP WITH TIME ZONE,
        client_online_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `,
    messages: `
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL,
        sender_type TEXT NOT NULL,
        sender_id TEXT,
        content TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
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

  // Migrate admin_users table to add email column if missing
  if (existingTables.has('admin_users')) {
    try {
      const columnsResult = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'admin_users'
      `);
      const existingColumns = new Set(columnsResult.rows.map(row => row.column_name));
      
      if (!existingColumns.has('email')) {
        await pool.query(`ALTER TABLE admin_users ADD COLUMN email TEXT UNIQUE`);
        console.log('✅ Added email column to admin_users table');
      }
    } catch (e) {
      console.error('Migration error for admin_users:', e);
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
    'CREATE INDEX IF NOT EXISTS conversations_client_session_idx ON conversations (client_session_id)',
    'CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages (conversation_id)',
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
  await seedWatches();
  await ensureAdminUser();
}

/**
 * Create/update admin user from environment variables
 */
export async function ensureAdminUser(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cib.com';
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';

  if (!adminPassword) {
    console.warn('⚠️ ADMIN_PASSWORD not set in environment variables');
    return;
  }

  // Use require for bcryptjs (loaded from api-server dependencies)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // Check if admin exists
  const existing = await pool.query(
    'SELECT id FROM admin_users WHERE email = $1 OR username = $2 LIMIT 1',
    [adminEmail, adminUsername]
  );

  if (existing.rows.length > 0) {
    // Update existing admin
    await pool.query(
      `UPDATE admin_users SET email = $1, username = $2, password_hash = $3 WHERE id = $4`,
      [adminEmail, adminUsername, passwordHash, existing.rows[0].id]
    );
    console.log('✅ Admin user updated from environment variables');
  } else {
    // Create new admin
    await pool.query(
      `INSERT INTO admin_users (username, email, password_hash, is_super_admin) VALUES ($1, $2, $3, true)`,
      [adminUsername, adminEmail, passwordHash]
    );
    console.log('✅ Admin user created from environment variables');
  }
}

/**
 * Seed default watches data
 */
export async function seedWatches(): Promise<void> {
  // Check if watches already exist
  const result = await pool.query('SELECT COUNT(*) FROM watches');
  if (parseInt(result.rows[0].count) > 0) {
    console.log('📦 Watches already seeded, skipping...');
    return;
  }

  console.log('🌱 Seeding default watches...');
  
  const defaultWatches = [
    { 
      name: 'Aurora Purple Watch', 
      nameAr: 'ساعة اورورا البنفسجي', 
      colorId: 'purple', 
      colorName: 'بنفسجي', 
      colorHex: '#9333ea', 
      imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/d1f281814_cibbankdash-elkqgt66_manus_space_watch-purple_fe9e6a0d_7ac2a8af.jpg',
      description: 'Striking and modern colors that make you the center of attention — ideal for those seeking distinction.', 
      descriptionAr: 'ألوان لافتة وعصرية تجعلك محط الأنظار — مثالية لمن يبحث عن التميّز.', 
      displayOrder: 1 
    },
    { 
      name: 'Aurora White Watch', 
      nameAr: 'ساعة اورورا ابيض', 
      colorId: 'white', 
      colorName: 'أبيض', 
      colorHex: '#f8fafc', 
      imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/3e5baac85_cibbankdash-elkqgt66_manus_space_watch-white_9d72ac02_09c75fd0.jpg',
      description: 'Elegant and luxurious design in pure white — adds a distinctive modern touch to your look.', 
      descriptionAr: 'تصميم أنيق وفخيم بلون أبيض نقي — تضفي لمسة عصرية مميزة على مظهرك.', 
      displayOrder: 2 
    },
    { 
      name: 'Aurora Green Watch', 
      nameAr: 'ساعة اورورا اخضر', 
      colorId: 'green', 
      colorName: 'أخضر', 
      colorHex: '#16a34a', 
      imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/dabfd5203_cibbankdash-elkqgt66_manus_space_watch-green_22679453_95bc43bd.jpg',
      description: 'Soft design with a calm color reflecting elegance and simplicity — perfect for daily looks.', 
      descriptionAr: 'تصميم ناعم بلون هادئ يعكس الأناقة والبساطة — مثالية للإطلالات اليومية.', 
      displayOrder: 3 
    },
    { 
      name: 'Aurora Rose Gold Watch', 
      nameAr: 'ساعة اورورا المريخي', 
      colorId: 'rosegold', 
      colorName: 'روز جولد', 
      colorHex: '#f43f5e', 
      imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/c92f1b8e3_cibbankdash-elkqgt66_manus_space_watch-rosegold_d9498af6_d07ac97b.jpg',
      description: 'Warm and soft color reflecting sophistication and elegance — your perfect choice for any occasion.', 
      descriptionAr: 'لون دافئ وناعم يعكس الرقي والأناقة — اختيارك المثالي لكل مناسبة.', 
      displayOrder: 4 
    },
    { 
      name: 'Aurora Black Watch', 
      nameAr: 'ساعة اورورا اسود', 
      colorId: 'black', 
      colorName: 'أسود', 
      colorHex: '#171717', 
      imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/706d6e274_cibbankdash-elkqgt66_manus_space_watch-black_342908dd_0a863039.jpg',
      description: 'Classic elegance with a luxurious touch — combines luxury and performance in a modern design.', 
      descriptionAr: 'أناقة كلاسيكية بلمسة فاخرة — تجمع بين الفخامة والأداء في تصميم عصري.', 
      displayOrder: 5 
    },
    { 
      name: 'Aurora Orange Watch', 
      nameAr: 'ساعة اورورا البرتقالي', 
      colorId: 'orange', 
      colorName: 'برتقالي', 
      colorHex: '#f97316', 
      imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/b9c6548ae_cibbankdash-elkqgt66_manus_space_watch-orange_e141c053_b4aef98a.jpg',
      description: 'Warm and attractive color reflecting vitality — your perfect choice for a radiant look.', 
      descriptionAr: 'لون دافئ وجذّاب يعكس الحيوية — اختيارك الأمثل لإطلالة مشرقة.', 
      displayOrder: 6 
    },
    { 
      name: 'Aurora Gold Watch', 
      nameAr: 'ساعة اورورا الذهبي', 
      colorId: 'gold', 
      colorName: 'ذهبي', 
      colorHex: '#eab308', 
      imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/e0a31cadd_cibbankdash-elkqgt66_manus_space_watch-gold_322d7cf1_b7c0a2b2.jpg',
      description: 'A luxurious golden touch reflecting sophistication and distinction — a watch that matches your refined taste.', 
      descriptionAr: 'لمسة ذهبية فاخرة تعكس الرقي والتميّز — ساعة تليق بذوقك الرفيع.', 
      displayOrder: 7 
    },
    { 
      name: 'Aurora Silver Watch', 
      nameAr: 'ساعة اورورا الفضي', 
      colorId: 'silver', 
      colorName: 'فضي', 
      colorHex: '#94a3b8', 
      imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/a69ae8340_cibbankdash-elkqgt66_manus_space_watch-silver_fd3b201d_b1402724.jpg',
      description: 'Shiny silver design reflecting modern luxury — your perfect choice for elegant occasions.', 
      descriptionAr: 'تصميم فضي لامع يعكس الفخامة العصرية — اختيارك الأمثل للمناسبات الراقية.', 
      displayOrder: 8 
    },
    { 
      name: 'Aurora Blue Watch', 
      nameAr: 'ساعة اورورا الأزرق', 
      colorId: 'blue', 
      colorName: 'أزرق', 
      colorHex: '#2563eb', 
      imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/57041acb2_cibbankdash-elkqgt66_manus_space_watch-blue_d8e7dc43_f929a4df.jpg',
      description: 'Classic blue color combining elegance and confidence — perfect for all times.', 
      descriptionAr: 'لون أزرق كلاسيكي يجمع بين الأناقة والثقة — مثالية لكل الأوقات.', 
      displayOrder: 9 
    },
  ];

  for (const watch of defaultWatches) {
    await pool.query(
      `INSERT INTO watches (name, name_ar, color_id, color_name, color_hex, image_url, description, description_ar, display_order, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
      [watch.name, watch.nameAr, watch.colorId, watch.colorName, watch.colorHex, watch.imageUrl, watch.description, watch.descriptionAr, watch.displayOrder]
    );
  }

  console.log(`✅ Seeded ${defaultWatches.length} default watches`);
}
