import { Router, type ISubrouter } from "express";
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

// ==================== WATCHES API ====================

// Get all watches
router.get("/watches", async (req, res) => {
  try {
    const watches = await db
      .select()
      .from(watchesTable)
      .orderBy(desc(watchesTable.displayOrder));
    res.json({ success: true, data: watches });
  } catch (error) {
    console.error("Error fetching watches:", error);
    res.status(500).json({ success: false, error: "فشل في جلب الساعات" });
  }
});

// Get single watch
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

// Create watch
const createWatchSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().min(1),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  colorId: z.string().min(1),
  colorName: z.string().min(1),
  colorHex: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
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

// Update watch
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

// Delete watch
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

// Toggle watch active status
router.patch("/watches/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    
    // First get current status
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

// ==================== ADMIN DEVICES API ====================

// Get all devices
router.get("/devices", async (req, res) => {
  try {
    const devices = await db
      .select()
      .from(adminDevicesTable)
      .orderBy(desc(adminDevicesTable.lastUsedAt));
    res.json({ success: true, data: devices });
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ success: false, error: "فشل في جلب الأجهزة" });
  }
});

// Register device
const registerDeviceSchema = z.object({
  deviceId: z.string().min(1),
  deviceName: z.string().min(1),
  deviceType: z.string().optional(),
  lastIp: z.string().optional(),
});

router.post("/devices", async (req, res) => {
  try {
    const data = registerDeviceSchema.parse(req.body);
    
    // Upsert device
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
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error("Error registering device:", error);
    res.status(500).json({ success: false, error: "فشل في تسجيل الجهاز" });
  }
});

// Delete device
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

// Delete all devices
router.delete("/devices", async (req, res) => {
  try {
    await db.delete(adminDevicesTable);
    res.json({ success: true, message: "تم حذف جميع الأجهزة بنجاح" });
  } catch (error) {
    console.error("Error deleting all devices:", error);
    res.status(500).json({ success: false, error: "فشل في حذف الأجهزة" });
  }
});

// ==================== ADMIN AUTH API ====================

// Change password
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
      // Create default admin if not exists
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

export default router;
