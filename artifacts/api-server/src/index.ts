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
  console.log("🚀 Starting CIB Prime API Server...");
  console.log(`📍 Port: ${port}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
  
  // Start server FIRST, then connect to DB
  const server = app.listen(port, async () => {
    console.log(`✅ HTTP Server started on port ${port}`);
    console.log(`📡 Health check: http://localhost:${port}/api/healthz`);
    
    // Connect to DB after server is running
    try {
      console.log("🗄️ Initializing database connection...");
      await initializeDatabase();
      console.log("✅ Database initialized successfully");
      
      // Seed data (non-blocking)
      setTimeout(async () => {
        try {
          const { db } = await import("@workspace/db");
          const { watchesTable, adminDevicesTable } = await import("@workspace/db");
          
          // Admin user is now created from environment variables in initializeDatabase()
          // See lib/db/src/index.ts -> ensureAdminUser()
          
          const existingWatches = await db.select().from(watchesTable).limit(1);
          if (existingWatches.length === 0) {
            const defaultWatches = [
              { name: 'Aurora Purple Watch', nameAr: 'ساعة اورورا البنفسجي', colorId: 'purple', colorName: 'بنفسجي', colorHex: '#9333ea', description: 'Striking and modern colors that make you the center of attention — ideal for those seeking distinction.', descriptionAr: 'ألوان لافتة وعصرية تجعلك محط الأنظار — مثالية لمن يبحث عن التميّز.', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/d1f281814_cibbankdash-elkqgt66_manus_space_watch-purple_fe9e6a0d_7ac2a8af.jpg', isActive: true, displayOrder: 1 },
              { name: 'Aurora White Watch', nameAr: 'ساعة اورورا ابيض', colorId: 'white', colorName: 'أبيض', colorHex: '#f8fafc', description: 'Elegant and luxurious design in pure white — adds a distinctive modern touch to your look.', descriptionAr: 'تصميم أنيق وفخيم بلون أبيض نقي — تضفي لمسة عصرية مميزة على مظهرك.', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/3e5baac85_cibbankdash-elkqgt66_manus_space_watch-white_9d72ac02_09c75fd0.jpg', isActive: true, displayOrder: 2 },
              { name: 'Aurora Green Watch', nameAr: 'ساعة اورورا اخضر', colorId: 'green', colorName: 'أخضر', colorHex: '#16a34a', description: 'Soft design with a calm color reflecting elegance and simplicity — perfect for daily looks.', descriptionAr: 'تصميم ناعم بلون هادئ يعكس الأناقة والبساطة — مثالية للإطلالات اليومية.', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/dabfd5203_cibbankdash-elkqgt66_manus_space_watch-green_22679453_95bc43bd.jpg', isActive: true, displayOrder: 3 },
              { name: 'Aurora Rose Gold Watch', nameAr: 'ساعة اورورا المريخي', colorId: 'rosegold', colorName: 'روز جولد', colorHex: '#f43f5e', description: 'Warm and soft color reflecting sophistication and elegance — your perfect choice for any occasion.', descriptionAr: 'لون دافئ وناعم يعكس الرقي والأناقة — اختيارك المثالي لكل مناسبة.', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/c92f1b8e3_cibbankdash-elkqgt66_manus_space_watch-rosegold_d9498af6_d07ac97b.jpg', isActive: true, displayOrder: 4 },
              { name: 'Aurora Black Watch', nameAr: 'ساعة اورورا اسود', colorId: 'black', colorName: 'أسود', colorHex: '#171717', description: 'Classic elegance with a luxurious touch — combines luxury and performance in a modern design.', descriptionAr: 'أناقة كلاسيكية بلمسة فاخرة — تجمع بين الفخامة والأداء في تصميم عصري.', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/706d6e274_cibbankdash-elkqgt66_manus_space_watch-black_342908dd_0a863039.jpg', isActive: true, displayOrder: 5 },
              { name: 'Aurora Orange Watch', nameAr: 'ساعة اورورا البرتقالي', colorId: 'orange', colorName: 'برتقالي', colorHex: '#f97316', description: 'Warm and attractive color reflecting vitality — your perfect choice for a radiant look.', descriptionAr: 'لون دافئ وجذّاب يعكس الحيوية — اختيارك الأمثل لإطلالة مشرقة.', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/b9c6548ae_cibbankdash-elkqgt66_manus_space_watch-orange_e141c053_b4aef98a.jpg', isActive: true, displayOrder: 6 },
              { name: 'Aurora Gold Watch', nameAr: 'ساعة اورورا الذهبي', colorId: 'gold', colorName: 'ذهبي', colorHex: '#eab308', description: 'A luxurious golden touch reflecting sophistication and distinction — a watch that matches your refined taste.', descriptionAr: 'لمسة ذهبية فاخرة تعكس الرقي والتميّز — ساعة تليق بذوقك الرفيع.', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/e0a31cadd_cibbankdash-elkqgt66_manus_space_watch-gold_322d7cf1_b7c0a2b2.jpg', isActive: true, displayOrder: 7 },
              { name: 'Aurora Silver Watch', nameAr: 'ساعة اورورا الفضي', colorId: 'silver', colorName: 'فضي', colorHex: '#94a3b8', description: 'Shiny silver design reflecting modern luxury — your perfect choice for elegant occasions.', descriptionAr: 'تصميم فضي لامع يعكس الفخامة العصرية — اختيارك الأمثل للمناسبات الراقية.', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/a69ae8340_cibbankdash-elkqgt66_manus_space_watch-silver_fd3b201d_b1402724.jpg', isActive: true, displayOrder: 8 },
              { name: 'Aurora Blue Watch', nameAr: 'ساعة اورورا الأزرق', colorId: 'blue', colorName: 'أزرق', colorHex: '#2563eb', description: 'Classic blue color combining elegance and confidence — perfect for all times.', descriptionAr: 'لون أزرق كلاسيكي يجمع بين الأناقة والثقة — مثالية لكل الأوقات.', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/57041acb2_cibbankdash-elkqgt66_manus_space_watch-blue_d8e7dc43_f929a4df.jpg', isActive: true, displayOrder: 9 },
            ];
            await db.insert(watchesTable).values(defaultWatches);
            console.log("✅ Seeded 9 watches");
          }
          
          const existingDevices = await db.select().from(adminDevicesTable).limit(1);
          if (existingDevices.length === 0) {
            await db.insert(adminDevicesTable).values([
              { deviceId: 'device-1', deviceName: 'iPhone 15 Pro', deviceType: 'mobile', lastIp: '192.168.1.100' },
              { deviceId: 'device-2', deviceName: 'MacBook Pro', deviceType: 'desktop', lastIp: '192.168.1.101' },
              { deviceId: 'device-3', deviceName: 'Samsung Galaxy S24', deviceType: 'mobile', lastIp: '192.168.1.102' },
            ]);
            console.log("✅ Seeded 3 devices");
          }
        } catch (seedError) {
          console.error("⚠️ Seed error:", seedError);
        }
      }, 2000);
    } catch (dbError) {
      console.error("❌ Database init failed:", dbError);
      console.log("⚠️ Server running without database");
    }
    
    setupRealtime(server);
    console.log("✅ WebSocket ready");
  });
}

process.on('uncaughtException', (error) => {
  console.error("❌ Uncaught Exception:", error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
});

start();
