import { Router, type ISubrouter } from "express";
import express from "express";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import fs from "fs";
import bcrypt from "bcryptjs";
import {
  db,
  watchesTable,
  adminDevicesTable,
  adminUsersTable,
  blockedDevicesTable,
} from "@workspace/db";
import { z } from "zod";
import { sessions, SESSION_DURATION_HOURS } from "../lib/sessions";

// Configure multer for image uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${randomUUID()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const router: ISubrouter = Router();

// ==================== AUTH CONFIG ====================
// Admin credentials are now loaded from environment variables
// and stored in the database (not in code)
const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_DURATION_HOURS = 1;

// Helper to get device ID from request
function getDeviceId(req: express.Request): string {
  const deviceId = req.headers["x-device-id"] as string;
  if (deviceId) return deviceId;
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(ip).digest("hex").substring(0, 32);
}

// Middleware to verify session AND device
async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "غير مصرح - يلزم تسجيل الدخول" });
  }
  
  const token = authHeader.substring(7);
  const session = sessions.get(token);
  
  if (!session) {
    return res.status(401).json({ success: false, error: "جلسة غير صالحة - يلزم تسجيل الدخول" });
  }
  
  // Check session expiry
  const now = new Date();
  const expiry = new Date(session.createdAt.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
  if (now > expiry) {
    sessions.delete(token);
    return res.status(401).json({ success: false, error: "انتهت الجلسة - يلزم تسجيل الدخول مجدداً" });
  }
  
  // Check if device is still in the database (not deleted)
  try {
    const [device] = await db
      .select()
      .from(adminDevicesTable)
      .where(eq(adminDevicesTable.deviceId, session.deviceId))
      .limit(1);
    
    if (!device) {
      // Device was deleted from admin panel
      sessions.delete(token);
      return res.status(401).json({ success: false, error: "تم حذف هذا الجهاز - يلزم تسجيل الدخول مجدداً" });
    }
  } catch (error) {
    console.error("Device check error:", error);
    // Continue without device check if error
  }
  
  // Attach session info to request
  (req as any).session = session;
  (req as any).deviceId = session.deviceId;
  next();
}

// Auth validation schema
const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ==================== AUTH API (PUBLIC) ====================

// Check if device is blocked
router.post("/auth/check", async (req, res) => {
  try {
    const deviceId = getDeviceId(req);
    console.log(`\n🔍 [AUTH CHECK] Device: ${deviceId}, IP: ${req.ip}`);
    
    const [blocked] = await db
      .select()
      .from(blockedDevicesTable)
      .where(eq(blockedDevicesTable.deviceId, deviceId))
      .limit(1);
    
    if (blocked && blocked.blockedUntil) {
      const now = new Date();
      if (blocked.blockedUntil > now) {
        const remainingMinutes = Math.ceil((blocked.blockedUntil.getTime() - now.getTime()) / 60000);
        console.log(`⚠️ [AUTH CHECK] Device BLOCKED, remaining: ${remainingMinutes} min`);
        return res.json({ 
          success: true, 
          blocked: true, 
          remainingMinutes,
          message: `تم حظر الجهاز. متبقي ${remainingMinutes} دقيقة.` 
        });
      }
    }
    
    console.log(`✅ [AUTH CHECK] Device OK, not blocked`);
    res.json({ success: true, blocked: false });
  } catch (error: any) {
    console.error(`❌ [AUTH CHECK] ERROR:`, error.message || error);
    res.status(500).json({ success: false, error: "خطأ في التحقق: " + (error.message || "خطأ غير معروف") });
  }
});

// Login endpoint
router.post("/auth/login", async (req, res) => {
  const deviceId = getDeviceId(req);
  const deviceName = (req.headers["x-device-name"] as string) || "جهاز غير معروف";
  const deviceType = (req.headers["x-device-type"] as string) || "desktop";
  
  console.log(`\n🔐 [LOGIN ATTEMPT] Device: ${deviceId}, Name: ${deviceName}, Type: ${deviceType}, IP: ${req.ip}`);
  
  try {
    // Check if blocked
    const [blocked] = await db
      .select()
      .from(blockedDevicesTable)
      .where(eq(blockedDevicesTable.deviceId, deviceId))
      .limit(1);
    
    if (blocked && blocked.blockedUntil) {
      const now = new Date();
      if (blocked.blockedUntil > now) {
        const remainingMinutes = Math.ceil((blocked.blockedUntil.getTime() - now.getTime()) / 60000);
        console.log(`🚫 [LOGIN] Device BLOCKED until ${blocked.blockedUntil}, remaining: ${remainingMinutes} min`);
        return res.status(403).json({ 
          success: false, 
          blocked: true, 
          remainingMinutes,
          message: `تم حظر الجهاز. متبقي ${remainingMinutes} دقيقة.` 
        });
      }
    }
    
    // Validate input
    const parseResult = authSchema.safeParse(req.body);
    if (!parseResult.success) {
      console.log(`⚠️ [LOGIN] Invalid input:`, parseResult.error.errors);
      return res.status(400).json({ success: false, error: "بيانات غير صحيحة: " + JSON.stringify(parseResult.error.errors) });
    }
    
    const { email, password } = parseResult.data;
    console.log(`📧 [LOGIN] Email: ${email}, Password length: ${password.length}`);
    
    // Query admin user from database
    const [adminUser] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.email, email))
      .limit(1);
    
    // Verify password using bcrypt
    let isValidPassword = false;
    if (adminUser && adminUser.passwordHash) {
      isValidPassword = await bcrypt.compare(password, adminUser.passwordHash);
    }
    
    if (!adminUser || !isValidPassword) {
      const now = new Date();
      console.log(`❌ [LOGIN] Wrong credentials for: ${email}`);
      
      if (blocked) {
        await db
          .update(blockedDevicesTable)
          .set({ 
            failedAttempts: blocked.failedAttempts + 1,
            blockedUntil: blocked.failedAttempts + 1 >= MAX_FAILED_ATTEMPTS 
              ? new Date(now.getTime() + BLOCK_DURATION_HOURS * 60 * 60 * 1000)
              : blocked.blockedUntil
          })
          .where(eq(blockedDevicesTable.deviceId, deviceId));
        console.log(`⚠️ [LOGIN] Updated failed attempts to ${blocked.failedAttempts + 1}`);
      } else {
        await db.insert(blockedDevicesTable).values({
          deviceId,
          failedAttempts: 1,
          blockedUntil: null
        });
        console.log(`⚠️ [LOGIN] Created blocked device record, attempts: 1`);
      }
      
      const [updatedBlocked] = await db
        .select()
        .from(blockedDevicesTable)
        .where(eq(blockedDevicesTable.deviceId, deviceId))
        .limit(1);
      
      if (updatedBlocked && updatedBlocked.blockedUntil && updatedBlocked.blockedUntil > now) {
        console.log(`🚫 [LOGIN] Device NOW BLOCKED until ${updatedBlocked.blockedUntil}`);
        return res.status(403).json({ 
          success: false, 
          blocked: true, 
          attemptsLeft: 0,
          remainingMinutes: BLOCK_DURATION_HOURS * 60,
          message: "تم حظر الجهاز لمدة ساعة بسبب المحاولات الفاشلة." 
        });
      }
      
      const attemptsLeft = MAX_FAILED_ATTEMPTS - (blocked?.failedAttempts || 0) - 1;
      console.log(`⚠️ [LOGIN] Wrong password, attempts left: ${attemptsLeft}`);
      return res.status(401).json({ 
        success: false, 
        error: "بيانات الدخول غير صحيحة",
        attemptsLeft
      });
    }
    
    console.log(`✅ [LOGIN] Credentials OK!`);
    
    // Success - reset failed attempts
    if (blocked) {
      await db.delete(blockedDevicesTable).where(eq(blockedDevicesTable.deviceId, deviceId));
      console.log(`🗑️ [LOGIN] Removed blocked device record`);
    }
    
    // Store device as trusted - INSERT OR UPDATE
    await db
      .insert(adminDevicesTable)
      .values({
        deviceId,
        deviceName,
        deviceType,
        lastIp: req.ip || req.socket.remoteAddress || "unknown",
        lastUsedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: adminDevicesTable.deviceId,
        set: {
          deviceName,
          deviceType,
          lastIp: req.ip || req.socket.remoteAddress || "unknown",
          lastUsedAt: new Date(),
        },
      });
    console.log(`📱 [LOGIN] Device saved to database`);
    
    // Generate session token
    const sessionToken = randomUUID();
    sessions.set(sessionToken, { deviceId, createdAt: new Date() });
    console.log(`🎫 [LOGIN] Session created: ${sessionToken.substring(0, 8)}...`);
    
    console.log(`✅ [LOGIN] SUCCESS!`);
    res.json({ 
      success: true, 
      token: sessionToken,
      deviceId,
      message: "تم تسجيل الدخول بنجاح"
    });
    
  } catch (error: any) {
    console.error(`❌ [LOGIN] FATAL ERROR:`, error.message || error);
    console.error(`❌ [LOGIN] Stack:`, error.stack);
    res.status(500).json({ success: false, error: "خطأ في تسجيل الدخول: " + (error.message || "خطأ غير معروف") });
  }
});

// Logout endpoint
router.post("/auth/logout", requireAuth, (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    sessions.delete(token);
  }
  res.json({ success: true, message: "تم تسجيل الخروج" });
});

// Logout from all sessions except current
router.post("/auth/logout-all", requireAuth, async (req, res) => {
  try {
    // Delete all devices from database
    await db.delete(adminDevicesTable);
    
    // Get current session's device
    const currentDeviceId = (req as any).deviceId;
    
    // Clear all sessions except current one
    const currentToken = req.headers.authorization?.substring(7);
    for (const [token, session] of sessions.entries()) {
      if (token !== currentToken) {
        sessions.delete(token);
      }
    }
    
    res.json({ success: true, message: "تم تسجيل الخروج من جميع الأجهزة" });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({ success: false, error: "فشل في تسجيل الخروج" });
  }
});

// Verify session endpoint
router.post("/auth/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, authenticated: false });
  }
  
  const token = authHeader.substring(7);
  const session = sessions.get(token);
  
  if (!session) {
    return res.status(401).json({ success: false, authenticated: false });
  }
  
  const now = new Date();
  const expiry = new Date(session.createdAt.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
  if (now > expiry) {
    sessions.delete(token);
    return res.status(401).json({ success: false, authenticated: false, error: "انتهت الجلسة" });
  }
  
  res.json({ success: true, authenticated: true });
});

// ==================== UPLOAD API ====================

router.post("/upload/image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }
  const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
  const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
  res.json({
    success: true,
    data: {
      url: imageUrl,
      filename: req.file.filename,
    },
  });
});

// ==================== CHANGE PASSWORD (PROTECTED) ====================

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const [admin] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.isSuperAdmin, true))
      .limit(1);

    if (!admin) {
      // First time setup - create admin with hashed password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.insert(adminUsersTable).values({
        username: "admin",
        passwordHash: hashedPassword,
        isSuperAdmin: true,
      });
      
      // Delete all sessions and devices
      sessions.clear();
      await db.delete(adminDevicesTable);
      
      return res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
    }

    const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: "كلمة المرور الحالية غير صحيحة" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(adminUsersTable).set({ passwordHash: hashedPassword }).where(eq(adminUsersTable.id, admin.id));

    // Delete all devices and clear all sessions EXCEPT current
    await db.delete(adminDevicesTable);
    const currentToken = req.headers.authorization?.substring(7);
    for (const [token] of sessions.entries()) {
      if (token !== currentToken) {
        sessions.delete(token);
      }
    }

    res.json({ success: true, message: "تم تغيير كلمة المرور وتسجيل الخروج من جميع الأجهزة" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error("Error changing password:", error);
    res.status(500).json({ success: false, error: "فشل في تغيير كلمة المرور" });
  }
});

// ==================== WATCHES API (PROTECTED) ====================

router.get("/watches", requireAuth, async (req, res) => {
  try {
    const result = await db.select().from(watchesTable);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("❌ [WATCHES] Error:", error.message || error);
    res.status(500).json({ success: false, error: "فشل في جلب الساعات" });
  }
});

router.get("/watches/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: "معرف الساعة غير صالح" });
    }
    const [watch] = await db.select().from(watchesTable).where(eq(watchesTable.id, id));
    if (!watch) {
      return res.status(404).json({ success: false, error: "الساعة غير موجودة" });
    }
    res.json({ success: true, data: watch });
  } catch (error: any) {
    console.error("Error fetching watch:", error.message || error);
    res.status(500).json({ success: false, error: "فشل في جلب الساعة" });
  }
});

const createWatchSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().min(1),
  colorId: z.string().min(1),
  colorName: z.string().min(1),
  colorHex: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

router.post("/watches", requireAuth, async (req, res) => {
  try {
    const data = createWatchSchema.parse(req.body);
    const [newWatch] = await db.insert(watchesTable).values(data).returning();
    res.status(201).json({ success: true, data: newWatch });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error("Error creating watch:", error);
    res.status(500).json({ success: false, error: "فشل في إنشاء الساعة" });
  }
});

router.put("/watches/:id", requireAuth, async (req, res) => {
  try {
    const [updated] = await db
      .update(watchesTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(watchesTable.id, parseInt(req.params.id)))
      .returning();
    if (!updated) {
      return res.status(404).json({ success: false, error: "الساعة غير موجودة" });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating watch:", error);
    res.status(500).json({ success: false, error: "فشل في تحديث الساعة" });
  }
});

router.delete("/watches/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(watchesTable).where(eq(watchesTable.id, parseInt(req.params.id)));
    res.json({ success: true, message: "تم حذف الساعة بنجاح" });
  } catch (error) {
    console.error("Error deleting watch:", error);
    res.status(500).json({ success: false, error: "فشل في حذف الساعة" });
  }
});

router.patch("/watches/:id/toggle", requireAuth, async (req, res) => {
  try {
    const [watch] = await db.select().from(watchesTable).where(eq(watchesTable.id, parseInt(req.params.id)));
    if (!watch) {
      return res.status(404).json({ success: false, error: "الساعة غير موجودة" });
    }
    const [updated] = await db
      .update(watchesTable)
      .set({ isActive: !watch.isActive, updatedAt: new Date() })
      .where(eq(watchesTable.id, parseInt(req.params.id)))
      .returning();
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error toggling watch:", error);
    res.status(500).json({ success: false, error: "فشل في تحديث الحالة" });
  }
});

// Seed default watches
router.post("/watches/seed", async (req, res) => {
  console.log("🌱 [WATCHES] Seeding default watches...");
  try {
    const existing = await db.select().from(watchesTable).limit(1);
    if (existing.length === 0) {
      console.log("📦 [WATCHES] No watches found, inserting defaults...");
      await db.insert(watchesTable).values([
        { name: 'Aurora Purple', nameAr: 'ساعة اورورا البنفسجي', colorId: 'purple', colorName: 'بنفسجي', colorHex: '#9333ea', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/d1f281814_cibbankdash-elkqgt66_manus_space_watch-purple_fe9e6a0d_7ac2a8af.jpg', isActive: true },
        { name: 'Aurora White', nameAr: 'ساعة اورورا ابيض', colorId: 'white', colorName: 'أبيض', colorHex: '#f3f4f6', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/3e5baac85_cibbankdash-elkqgt66_manus_space_watch-white_9d72ac02_09c75fd0.jpg', isActive: true },
        { name: 'Aurora Green', nameAr: 'ساعة اورورا اخضر', colorId: 'green', colorName: 'أخضر', colorHex: '#22c55e', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/dabfd5203_cibbankdash-elkqgt66_manus_space_watch-green_22679453_95bc43bd.jpg', isActive: true },
        { name: 'Aurora Rose Gold', nameAr: 'ساعة اورورا روز جولد', colorId: 'rosegold', colorName: 'روز جولد', colorHex: '#f472b6', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/c92f1b8e3_cibbankdash-elkqgt66_manus_space_watch-rosegold_d9498af6_d07ac97b.jpg', isActive: true },
        { name: 'Aurora Black', nameAr: 'ساعة اورورا اسود', colorId: 'black', colorName: 'أسود', colorHex: '#18181b', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/706d6e274_cibbankdash-elkqgt66_manus_space_watch-black_342908dd_0a863039.jpg', isActive: true },
      ]);
      console.log("✅ [WATCHES] Default watches inserted successfully!");
      return res.json({ success: true, message: "تم إضافة الساعات بنجاح" });
    }
    console.log("ℹ️ [WATCHES] Watches already exist, skipping seed");
    res.json({ success: true, message: "الساعات موجودة بالفعل" });
  } catch (error) {
    console.error("❌ [WATCHES] Seed error:", error);
    res.status(500).json({ success: false, error: "فشل في إضافة الساعات" });
  }
});

// ==================== DEVICES API (PROTECTED) ====================

router.get("/devices", requireAuth, async (req, res) => {
  try {
    const result = await db.select().from(adminDevicesTable);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("❌ [DEVICES] Error:", error.message || error);
    res.status(500).json({ success: false, error: "فشل في جلب الأجهزة" });
  }
});

router.post("/devices", requireAuth, async (req, res) => {
  try {
    const [device] = await db
      .insert(adminDevicesTable)
      .values({ ...req.body, lastUsedAt: new Date() })
      .onConflictDoUpdate({
        target: adminDevicesTable.deviceId,
        set: { lastUsedAt: new Date(), lastIp: req.body.lastIp },
      })
      .returning();
    res.status(201).json({ success: true, data: device });
  } catch (error) {
    console.error("Error registering device:", error);
    res.status(500).json({ success: false, error: "فشل في تسجيل الجهاز" });
  }
});

router.delete("/devices/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(adminDevicesTable).where(eq(adminDevicesTable.id, parseInt(req.params.id)));
    res.json({ success: true, message: "تم حذف الجهاز بنجاح" });
  } catch (error) {
    console.error("Error deleting device:", error);
    res.status(500).json({ success: false, error: "فشل في حذف الجهاز" });
  }
});

router.delete("/devices", requireAuth, async (req, res) => {
  try {
    await db.delete(adminDevicesTable);
    res.json({ success: true, message: "تم حذف جميع الأجهزة بنجاح" });
  } catch (error) {
    console.error("Error deleting all devices:", error);
    res.status(500).json({ success: false, error: "فشل في حذف الأجهزة" });
  }
});

// Seed default devices
router.post("/devices/seed", async (req, res) => {
  console.log("🌱 [DEVICES] Seeding default devices...");
  try {
    const existing = await db.select().from(adminDevicesTable).limit(1);
    if (existing.length === 0) {
      console.log("📦 [DEVICES] No devices found, inserting defaults...");
      await db.insert(adminDevicesTable).values([
        { deviceId: 'device-1', deviceName: 'iPhone 15 Pro', deviceType: 'mobile', lastIp: '192.168.1.100' },
        { deviceId: 'device-2', deviceName: 'MacBook Pro', deviceType: 'desktop', lastIp: '192.168.1.101' },
        { deviceId: 'device-3', deviceName: 'Samsung Galaxy S24', deviceType: 'mobile', lastIp: '192.168.1.102' },
      ]);
      console.log("✅ [DEVICES] Default devices inserted successfully!");
      return res.json({ success: true, message: "تم إضافة الأجهزة بنجاح" });
    }
    console.log("ℹ️ [DEVICES] Devices already exist, skipping seed");
    res.json({ success: true, message: "الأجهزة موجودة بالفعل" });
  } catch (error) {
    console.error("❌ [DEVICES] Seed error:", error);
    res.status(500).json({ success: false, error: "فشل في إضافة الأجهزة" });
  }
});

export default router;
