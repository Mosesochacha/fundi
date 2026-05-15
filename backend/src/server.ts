
// backend/src/server.ts
import dotenv from "dotenv";
dotenv.config();

// Initialize Sentry before other imports
import * as Sentry from "@sentry/node";
import type { ErrorEvent, EventHint } from "@sentry/node";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    debug: process.env.SENTRY_DEBUG === "true", // Only enable debug if explicitly set
    beforeSend(event: ErrorEvent, hint: EventHint) {
      // Filter out certain errors if needed
      return event;
    },
  });
}

import http from "http";
import app from "./app";
import {
  testConnection,
  closeConnection,
} from "./config/database";
import { initializeRedis } from "./config/redis";
import { logError } from "./utils/helpers";
import { startCronJobs, stopCronJobs } from "./jobs/cronJobs";
import { setupWebSocket } from "./middleware/websocket";
import logger from "./utils/logger";

// Server configuration
const PORT = parseInt(process.env.PORT || "5001", 10);
const HOST = process.env.HOST || "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";

const expressServer = http.createServer(app);
// Initialize WebSocket server on the same HTTP server
setupWebSocket(expressServer);
const server = expressServer;

const initializeServices = async (): Promise<void> => {
  logger.info("Initializing services...");

  const dbTimeout = setTimeout(() => {
    logger.warn("Database connection timeout (15s), continuing without database...");
  }, 15000);

  try {
    const dbConnected = await testConnection();
    clearTimeout(dbTimeout);
  } catch (error) {
    clearTimeout(dbTimeout);
    logger.error("Database initialization failed", { error });
  }

  try {
    await initializeRedis();
    logger.info("Redis initialized");
  } catch (error) {
    logger.error("Redis initialization failed", { error });
  }

  try {
    startCronJobs();
    logger.info("Cron jobs started");
  } catch (error) {
    logger.error("Cron jobs initialization failed", { error });
  }

  logger.info("Services initialized");
};

const startServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    server.listen(PORT, HOST, () => {
      logger.info(`Server running on http://${HOST}:${PORT}`);
      resolve();
    });

    server.on("error", (error: any) => {
      reject(error);
    });
  });
};

const gracefulShutdown = (signal: string): void => {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  server.close(async (err) => {
    if (err) {
      logger.error("Error during server shutdown", { error: err });
      process.exit(1);
    }

    try {
      stopCronJobs();
      logger.info("Cron jobs stopped");

      await closeConnection();
      logger.info("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      logger.error("Error during cleanup", { error });
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.warn("Force shutdown after timeout");
    process.exit(1);
  }, 10000);
};

const setupErrorHandlers = (): void => {
  process.on("uncaughtException", (error) => {
    logError(error, "Uncaught Exception");
    logger.error("Uncaught Exception", { error });

    // Report to Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        tags: {
          errorType: "uncaught_exception",
        },
      });
    }
    
    if (NODE_ENV === "production") gracefulShutdown("UNCAUGHT_EXCEPTION");
  });

  process.on("unhandledRejection", (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logError(error, "Unhandled Rejection");
    logger.error("Unhandled Rejection", { reason });
    
    // Report to Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        tags: {
          errorType: "unhandled_rejection",
        },
        extra: {
          reason: reason,
        },
      });
    }
    
    if (NODE_ENV === "production") gracefulShutdown("UNHANDLED_REJECTION");
  });

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};

const main = async (): Promise<void> => {
  try {
    logger.info("Starting server...");
    setupErrorHandlers();
    await initializeServices();
    await startServer();
    logger.info(`Server running on ${HOST}:${PORT} in ${NODE_ENV} mode`);
  } catch (error: any) {
    logger.error("Server startup failed", { 
      error: error?.message || error,
      stack: error?.stack 
    });
    console.error("FATAL: Server startup failed:", error?.message || error);
    if (error?.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
};


main();

export { server, app };
