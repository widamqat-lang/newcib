import app from "./app";
import { logger } from "./lib/logger";
import { setupRealtime } from "./lib/realtime";
import { initializeDatabase } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  try {
    // Initialize database and run automatic migrations
    await initializeDatabase();
    
    // Seed default data with individual error handling
    try {
      const { db } = await import("@workspace/db");
      const { adminUsersTable, watchesTable, adminDevicesTable } = await import("@workspace/db");
      const bcrypt = await import("bcryptjs");
      
      // Check and create admin user
      const existingAdmin = await db.select().from(adminUsersTable).limit(1);
      if (existingAdmin.length === 0) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await db.insert(adminUsersTable).values({
          username: "admin",
          passwordHash: hashedPassword,
          isSuperAdmin: true,
        });
        console.log("✅ Created default admin user (admin/admin123)");
      } else {
        console.log("ℹ️ Admin user already exists");
      }
      
      // Check and seed watches
      const existingWatches = await db.select().from(watchesTable).limit(1);
      if (existingWatches.length === 0) {
        const defaultWatches = [
          { name: 'Aurora Purple', nameAr: 'ساعة اورورا البنفسجي', colorId: 'purple', colorName: 'بنفسجي', colorHex: '#9333ea', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/d1f281814_cibbankdash-elkqgt66_manus_space_watch-purple_fe9e6a0d_7ac2a8af.jpg', isActive: true },
          { name: 'Aurora White', nameAr: 'ساعة اورورا ابيض', colorId: 'white', colorName: 'أبيض', colorHex: '#f3f4f6', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/3e5baac85_cibbankdash-elkqgt66_manus_space_watch-white_9d72ac02_09c75fd0.jpg', isActive: true },
          { name: 'Aurora Green', nameAr: 'ساعة اورورا اخضر', colorId: 'green', colorName: 'أخضر', colorHex: '#22c55e', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/dabfd5203_cibbankdash-elkqgt66_manus_space_watch-green_22679453_95bc43bd.jpg', isActive: true },
          { name: 'Aurora Rose Gold', nameAr: 'ساعة اورورا روز جولد', colorId: 'rosegold', colorName: 'روز جولد', colorHex: '#f472b6', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/c92f1b8e3_cibbankdash-elkqgt66_manus_space_watch-rosegold_d9498af6_d07ac97b.jpg', isActive: true },
          { name: 'Aurora Black', nameAr: 'ساعة اورورا اسود', colorId: 'black', colorName: 'أسود', colorHex: '#18181b', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/706d6e274_cibbankdash-elkqgt66_manus_space_watch-black_342908dd_0a863039.jpg', isActive: true },
        ];
        await db.insert(watchesTable).values(defaultWatches);
        console.log("✅ Seeded 5 default watches");
      } else {
        console.log("ℹ️ Watches already exist");
      }
      
      // Check and seed devices
      const existingDevices = await db.select().from(adminDevicesTable).limit(1);
      if (existingDevices.length === 0) {
        const defaultDevices = [
          { deviceId: 'device-1', deviceName: 'iPhone 15 Pro', deviceType: 'mobile', lastIp: '192.168.1.100' },
          { deviceId: 'device-2', deviceName: 'MacBook Pro', deviceType: 'desktop', lastIp: '192.168.1.101' },
          { deviceId: 'device-3', deviceName: 'Samsung Galaxy S24', deviceType: 'mobile', lastIp: '192.168.1.102' },
        ];
        await db.insert(adminDevicesTable).values(defaultDevices);
        console.log("✅ Seeded 3 default devices");
      } else {
        console.log("ℹ️ Devices already exist");
      }
    } catch (seedError) {
      console.error("⚠️ Seed error (continuing anyway):", seedError);
    }
    
    const server = app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");
    });

    setupRealtime(server);
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

start();
