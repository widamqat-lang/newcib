import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import uploadRouter from "./upload";
import express from "express";
import path from "path";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/admin", adminRouter);
router.use("/upload", uploadRouter);

// Serve uploaded files
const uploadsDir = path.join(process.cwd(), "uploads");
router.use("/uploads", express.static(uploadsDir));

export default router;
