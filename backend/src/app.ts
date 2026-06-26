import express from "express";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import { applySecurityMiddleware } from "./middleware/security";
import routes from "./routes";
import { logError } from "./utils/helpers";
import { HTTP_STATUS } from "./utils/constants";
import cors from "cors";
import * as Sentry from "@sentry/node";

dotenv.config();

const app = express();
const uploadsCorsOrigins = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  if (!origin) return callback(null, true);

  const allowedOrigins = process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(",") : [];
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  
  return callback(new Error('Not allowed by CORS'), false);
};

const uploadsRoot = path.join(process.cwd(), "uploads");
const inlineExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
]);

app.use(
  "/uploads",
  cors({
    origin: uploadsCorsOrigins,
    methods: ["GET"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-CSRF-Token"],
    credentials: true,
  }),
  express.static(uploadsRoot, {
    setHeaders: (res, filePath) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      const ext = path.extname(filePath).toLowerCase();
      
      if (inlineExtensions.has(ext)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("Expires", new Date(Date.now() + 31536000000).toUTCString());
      } else {
        res.setHeader("Content-Disposition", "attachment");
        res.setHeader("Cache-Control", "public, max-age=86400");
      }
    },
  })
);

app.use(
  "/public",
  express.static(path.join(process.cwd(), "public"), {
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  })
);

applySecurityMiddleware(app);

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ 
  limit: "10mb",
  strict: true,
  verify: (req: any, res: any, buf: Buffer, encoding: string) => {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
      }
    }
  }
}));
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const API_VERSION = "/api/v1";
app.use(API_VERSION, routes);

app.get(["/health", "/healthz"], (req, res) => {
  res.status(200).json({ ok: true, uptime: process.uptime() });
});

const FRONTEND_URL = process.env.APP_DOMAIN;

app.get("/", (req, res) => {
  if (FRONTEND_URL) {
    res.redirect(FRONTEND_URL);
  } else {
    res.json({
      message: "lot",
      version: "1.0.0",
      status: "running",
      timestamp: new Date().toISOString(),
    });
  }
});

app.post("/", (req, res) => {
  res.status(405).json({
    success: false,
    message: "Method not allowed",
    allowedMethods: ["GET"],
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/*", (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: "/api",
  });
});

app.use(/^(?!\/uploads|\/public|\/api).*/, (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    suggestion: "Visit /api for available endpoints",
  });
});

app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logError(error, "Global Error Handler");

    if (process.env.SENTRY_DSN && error.status !== 401 && error.status !== 403) {
      Sentry.captureException(error, {
        tags: {
          errorType: "app_global_error_handler",
          errorName: error.name,
          statusCode: error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        },
        extra: {
          url: req.originalUrl,
          method: req.method,
          status: error.status,
        },
        contexts: {
          request: {
            url: req.originalUrl,
            method: req.method,
            headers: req.headers,
          },
        },
      });
    }

    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid JSON in request body",
        timestamp: new Date().toISOString(),
      });
    }

    if (error.name === "ValidationError") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
        timestamp: new Date().toISOString(),
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: "Duplicate entry",
        field: error.errors?.[0]?.path,
        timestamp: new Date().toISOString(),
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Invalid token",
        timestamp: new Date().toISOString(),
      });
    }

    const isDevelopment = process.env.NODE_ENV === "development";
    
    res.status(error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: isDevelopment ? error.message : "Internal server error",
      ...(isDevelopment && {
        stack: error.stack,
        details: error,
      }),
      timestamp: new Date().toISOString(),
    });
  }
);

export default app;
