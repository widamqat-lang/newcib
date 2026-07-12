import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Request timeout middleware
const REQUEST_TIMEOUT_MS = 20000; // 20 seconds

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
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(process.cwd(), "public")));

// Request timeout wrapper
app.use((req: Request, res: Response, next: NextFunction) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error(`⏰ Request timeout: ${req.method} ${req.url}`);
      res.status(504).json({ 
        success: false, 
        error: "انتهت مهلة الطلب - يرجى المحاولة مرة أخرى" 
      });
    }
  }, REQUEST_TIMEOUT_MS);
  
  res.on('finish', () => clearTimeout(timeout));
  res.on('close', () => clearTimeout(timeout));
  next();
});

// SPA fallback - serve index.html for all non-API routes
app.get("/{*splat}", (req: Request, res: Response) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(process.cwd(), "public", "index.html"));
  }
});

app.use("/api", router);

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
