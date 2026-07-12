import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Trust proxy for accurate IP behind reverse proxy
app.set('trust proxy', 1);

// Logging middleware
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id', 'x-device-name', 'x-device-type'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes FIRST
app.use("/api", router);

// Health check endpoints for Railway (after API routes)
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/up", (_req, res) => res.send("OK"));

// Serve static files from public directory
app.use(express.static(path.join(process.cwd(), "public")));

// SPA fallback - serve index.html for all non-API routes
app.get("/{*splat}", (req: Request, res: Response) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(process.cwd(), "public", "index.html"));
  }
});

// Global error handler for uncaught errors
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Unhandled error:", err.message);
  console.error("Stack:", err.stack);
  
  if (!res.headersSent) {
    res.status(500).json({ 
      success: false, 
      error: "حدث خطأ داخلي في الخادم" 
    });
  }
});

export default app;
