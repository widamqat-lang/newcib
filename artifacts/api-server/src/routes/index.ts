import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import uploadRouter from "./upload";
import conversationsRouter from "./conversations";
import express from "express";
import path from "path";
import { db, watchesTable } from "@workspace/db";

const router: IRouter = Router();

// Health check يجب أن يكون أولاً
router.use(healthRouter);

// Admin routes (مع auth)
router.use("/admin", adminRouter);

// Upload routes
router.use("/upload", uploadRouter);

// Conversations routes (للإدارة - يتطلب auth)
router.use("/conversations", conversationsRouter);

// Public watches endpoint for customers
router.get("/watches", async (_req, res) => {
  try {
    const result = await db.select().from(watchesTable).orderBy(watchesTable.displayOrder);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("❌ [WATCHES] Error:", error.message || error);
    res.status(500).json({ success: false, error: "فشل في جلب الساعات" });
  }
});

// Serve uploaded files
const uploadsDir = path.join(process.cwd(), "uploads");
router.use("/uploads", express.static(uploadsDir));

export default router;
