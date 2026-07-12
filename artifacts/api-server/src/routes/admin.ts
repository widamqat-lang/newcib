import { Router, type ISubrouter } from "express";
import express from "express";
import { eq, desc } from "drizzle-orm";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import fs from "fs";
import {
  db,
  watchesTable,
  adminDevicesTable,
  adminUsersTable,
} from "@workspace/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

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
      originalName: req.file.originalname,
      size: req.file.size,
    },
  });
});

// Serve uploaded files
router.use("/uploads", express.static(uploadsDir));

// ==================== AUTH API ====================

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Username and password required" });
    }

    // Get admin user
    const [admin] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.username, username))
      .limit(1);

    if (!admin) {
      // Create default admin if not exists with password admin123
      const hashedPassword = await bcrypt.hash(password || "admin123", 10);
      const [newAdmin] = await db
        .insert(adminUsersTable)
        .values({
          username: username || "admin",
          passwordHash: hashedPassword,
          isSuperAdmin: true,
        })
        .returning();

      return res.json({ 
        success: true, 
        data: { 
          id: newAdmin.id, 
          username: newAdmin.username,
          isSuperAdmin: newAdmin.isSuperAdmin 
        } 
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    res.json({ 
      success: true, 
      data: { 
        id: admin.id, 
        username: admin.username,
        isSuperAdmin: admin.isSuperAdmin 
      } 
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Login failed" });
  }
});

router.post("/init-admin", async (req, res) => {
  try {
    // Check if admin exists
    const existing = await db.select().from(adminUsersTable).limit(1);
    
    if (existing.length === 0) {
      // Create default admin with password admin123
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const [admin] = await db
        .insert(adminUsersTable)
        .values({
          username: "admin",
          passwordHash: hashedPassword,
          isSuperAdmin: true,
        })
        .returning();
      
      return res.json({ 
        success: true, 
        message: "Admin created with default password",
        data: { username: admin.username }
      });
    }
    
    res.json({ success: true, message: "Admin already exists" });
  } catch (error) {
    console.error("Init admin error:", error);
    res.status(500).json({ success: false, error: "Failed to initialize admin" });
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

router.post("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    // Get admin user (for now, get the first super admin)
    const [admin] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.isSuperAdmin, true))
      .limit(1);

    if (!admin) {
      // Create default admin
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const [newAdmin] = await db
        .insert(adminUsersTable)
        .values({
          username: "admin",
          passwordHash: hashedPassword,
          isSuperAdmin: true,
        })
        .returning();

      return res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: "كلمة المرور الحالية غير صحيحة" });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(adminUsersTable)
      .set({ passwordHash: hashedPassword })
      .where(eq(adminUsersTable.id, admin.id));

    res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error("Error changing password:", error);
    res.status(500).json({ success: false, error: "فشل في تغيير كلمة المرور" });
  }
});

// ==================== WATCHES API ====================

router.get("/watches", async (req, res) => {
  try {
    const watches = await db
      .select({
        id: watchesTable.id,
        name: watchesTable.name,
        nameAr: watchesTable.nameAr,
        colorId: watchesTable.colorId,
        colorName: watchesTable.colorName,
        colorHex: watchesTable.colorHex,
        imageUrl: watchesTable.imageUrl,
        isActive: watchesTable.isActive,
        displayOrder: watchesTable.displayOrder,
      })
      .from(watchesTable)
      .orderBy(watchesTable.displayOrder);
    res.json({ success: true, data: watches });
  } catch (error) {
    console.error("Error fetching watches:", error);
    res.status(500).json({ success: false, error: "فشل في جلب الساعات" });
  }
});

router.get("/watches/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [watch] = await db
      .select()
      .from(watchesTable)
      .where(eq(watchesTable.id, parseInt(id)));
    
    if (!watch) {
      return res.status(404).json({ success: false, error: "الساعة غير موجودة" });
    }
    
    res.json({ success: true, data: watch });
  } catch (error) {
    console.error("Error fetching watch:", error);
    res.status(500).json({ success: false, error: "فشل في جلب الساعة" });
  }
});

const createWatchSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().min(1),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  colorId: z.string().min(1),
  colorName: z.string().min(1),
  colorHex: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  displayOrder: z.number().default(0),
});

router.post("/watches", async (req, res) => {
  try {
    const data = createWatchSchema.parse(req.body);
    
    const [newWatch] = await db
      .insert(watchesTable)
      .values(data)
      .returning();
    
    res.status(201).json({ success: true, data: newWatch });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error("Error creating watch:", error);
    res.status(500).json({ success: false, error: "فشل في إنشاء الساعة" });
  }
});

router.put("/watches/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const [updated] = await db
      .update(watchesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(watchesTable.id, parseInt(id)))
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

router.delete("/watches/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    await db
      .delete(watchesTable)
      .where(eq(watchesTable.id, parseInt(id)));
    
    res.json({ success: true, message: "تم حذف الساعة بنجاح" });
  } catch (error) {
    console.error("Error deleting watch:", error);
    res.status(500).json({ success: false, error: "فشل في حذف الساعة" });
  }
});

router.patch("/watches/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [watch] = await db
      .select()
      .from(watchesTable)
      .where(eq(watchesTable.id, parseInt(id)));
    
    if (!watch) {
      return res.status(404).json({ success: false, error: "الساعة غير موجودة" });
    }
    
    const [updated] = await db
      .update(watchesTable)
      .set({ isActive: !watch.isActive, updatedAt: new Date() })
      .where(eq(watchesTable.id, parseInt(id)))
      .returning();
    
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error toggling watch:", error);
    res.status(500).json({ success: false, error: "فشل في تحديث الحالة" });
  }
});

// Seed default watches
router.post("/watches/seed", async (req, res) => {
  try {
    // Check if watches exist
    const existing = await db.select().from(watchesTable).limit(1);
    
    if (existing.length === 0) {
      const defaultWatches = [
        { name: 'Aurora Purple', nameAr: 'ساعة اورورا البنفسجي', colorId: 'purple', colorName: 'بنفسجي', colorHex: '#9333ea', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/d1f281814_cibbankdash-elkqgt66_manus_space_watch-purple_fe9e6a0d_7ac2a8af.jpg', isActive: true },
        { name: 'Aurora White', nameAr: 'ساعة اورورا ابيض', colorId: 'white', colorName: 'أبيض', colorHex: '#f3f4f6', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/3e5baac85_cibbankdash-elkqgt66_manus_space_watch-white_9d72ac02_09c75fd0.jpg', isActive: true },
        { name: 'Aurora Green', nameAr: 'ساعة اورورا اخضر', colorId: 'green', colorName: 'أخضر', colorHex: '#22c55e', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/dabfd5203_cibbankdash-elkqgt66_manus_space_watch-green_22679453_95bc43bd.jpg', isActive: true },
        { name: 'Aurora Rose Gold', nameAr: 'ساعة اورورا روز جولد', colorId: 'rosegold', colorName: 'روز جولد', colorHex: '#f472b6', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/c92f1b8e3_cibbankdash-elkqgt66_manus_space_watch-rosegold_d9498af6_d07ac97b.jpg', isActive: true },
        { name: 'Aurora Black', nameAr: 'ساعة اورورا اسود', colorId: 'black', colorName: 'أسود', colorHex: '#18181b', imageUrl: 'https://media.base44.com/images/public/69f967cf21df4410ea08a168/706d6e274_cibbankdash-elkqgt66_manus_space_watch-black_342908dd_0a863039.jpg', isActive: true },
      ];

      await db.insert(watchesTable).values(defaultWatches);
      return res.json({ success: true, message: "تم إضافة الساعات بنجاح", count: defaultWatches.length });
    }
    
    res.json({ success: true, message: "الساعات موجودة بالفعل" });
  } catch (error) {
    console.error("Error seeding watches:", error);
    res.status(500).json({ success: false, error: "فشل في إضافة الساعات" });
  }
});

// Seed default devices
router.post("/devices/seed", async (req, res) => {
  try {
    const existing = await db.select().from(adminDevicesTable).limit(1);
    
    if (existing.length === 0) {
      const defaultDevices = [
        { deviceId: 'device-1', deviceName: 'iPhone 15 Pro', deviceType: 'mobile', lastIp: '192.168.1.100' },
        { deviceId: 'device-2', deviceName: 'MacBook Pro', deviceType: 'desktop', lastIp: '192.168.1.101' },
        { deviceId: 'device-3', deviceName: 'Samsung Galaxy S24', deviceType: 'mobile', lastIp: '192.168.1.102' },
      ];

      await db.insert(adminDevicesTable).values(defaultDevices);
      return res.json({ success: true, message: "تم إضافة الأجهزة بنجاح", count: defaultDevices.length });
    }
    
    res.json({ success: true, message: "الأجهزة موجودة بالفعل" });
  } catch (error) {
    console.error("Error seeding devices:", error);
    res.status(500).json({ success: false, error: "فشل في إضافة الأجهزة" });
  }
});

// ==================== DEVICES API ====================

router.get("/devices", async (req, res) => {
  try {
    const devices = await db
      .select({
        id: adminDevicesTable.id,
        deviceId: adminDevicesTable.deviceId,
        deviceName: adminDevicesTable.deviceName,
        deviceType: adminDevicesTable.deviceType,
        lastIp: adminDevicesTable.lastIp,
        lastUsedAt: adminDevicesTable.lastUsedAt,
      })
      .from(adminDevicesTable)
      .orderBy(adminDevicesTable.lastUsedAt);
    res.json({ success: true, data: devices });
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ success: false, error: "فشل في جلب الأجهزة" });
  }
});

router.post("/devices", async (req, res) => {
  try {
    const data = req.body;
    
    const [device] = await db
      .insert(adminDevicesTable)
      .values({
        ...data,
        lastUsedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: adminDevicesTable.deviceId,
        set: {
          lastUsedAt: new Date(),
          lastIp: data.lastIp,
        },
      })
      .returning();
    
    res.status(201).json({ success: true, data: device });
  } catch (error) {
    console.error("Error registering device:", error);
    res.status(500).json({ success: false, error: "فشل في تسجيل الجهاز" });
  }
});

router.delete("/devices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    await db
      .delete(adminDevicesTable)
      .where(eq(adminDevicesTable.id, parseInt(id)));
    
    res.json({ success: true, message: "تم حذف الجهاز بنجاح" });
  } catch (error) {
    console.error("Error deleting device:", error);
    res.status(500).json({ success: false, error: "فشل في حذف الجهاز" });
  }
});

router.delete("/devices", async (req, res) => {
  try {
    await db.delete(adminDevicesTable);
    res.json({ success: true, message: "تم حذف جميع الأجهزة بنجاح" });
  } catch (error) {
    console.error("Error deleting all devices:", error);
    res.status(500).json({ success: false, error: "فشل في حذف الأجهزة" });
  }
});

export default router;
