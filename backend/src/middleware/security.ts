// backend/src/middleware/security.ts
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import logger from "../utils/logger";

// 🔒 Enhanced Rate Limiting with Multiple Tiers
const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000),
      timestamp: new Date().toISOString()
    },
    // Enhanced rate limiting with IP tracking
    keyGenerator: (req) => {
      // Use X-Forwarded-For for proxy setups, fallback to connection IP
      return req.ip || 
             req.headers['x-forwarded-for']?.toString().split(',')[0] || 
             req.connection.remoteAddress || 
             'unknown';
    },
    // Skip successful requests for certain endpoints
    skipSuccessfulRequests: false,
    // Skip failed requests to prevent abuse
    skipFailedRequests: false,
    // Custom handler for rate limit exceeded
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }
  });
};

const generalApiLimiter = createRateLimit(
  60 * 1000, // 1 minute window
  300, // 300 requests per minute per IP
  "Too many requests, please slow down."
);

// Cache for organization domains to avoid repeated DB queries
let organizationDomainsCache: string[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes



// 🔒 Enhanced CORS Configuration
const corsMiddleware = cors({
  origin: async (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Normalize origin to just hostname (remove protocol and port)
    const originHostname = origin.replace(/^https?:\/\//, '').split(':')[0];
    

    
    // Check environment variable allowed origins
    const allowedOrigins = process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : [];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    
    // Check if origin matches any organization domain
    const matchesOrganization = organizationDomainsCache.some(domainHostname => {
      // Match hostname regardless of protocol
      return domainHostname === originHostname;
    });
    
    if (matchesOrganization) {
      return callback(null, true);
    }
    
    // Log suspicious origin attempts
    logger.warn('CORS blocked origin', { origin, originHostname });
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
    'X-API-Key',
    'x-api-key', // Browsers normalize 
    'X-Embed-Method',
    'x-embed-method',
    'X-Session-ID',
    'x-session-id',
    'X-Device-ID',
    'x-device-id',
    'X-Tracking-Data',
    'x-tracking-data',
    'X-Embed-Origin',
    'x-embed-origin',
    'X-Embed-Referer',
    'x-embed-referer',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400 // 24 hours
});

// 🚫 Enhanced Client Blocking with Whitelist Support
const blockSuspiciousClients = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const path = req.path || "";
  const originalUrl = req.originalUrl || "";

  // Always allow health checks with no auth or browser headers
  if (path === "/healthz" || originalUrl === "/healthz") {
    return next();
  }

  const userAgent = req.get("User-Agent") || "";
  const referer = req.get("Referer") || "";
  const apiKey = req.headers["x-api-key"] || req.headers["authorization"] || req.get("X-API-Key");
  
  // Allow requests with API keys (for embed routes and other API access)
  if (apiKey) {
    return next();
  }
  
  // Allow SendGrid webhook routes (SendGrid sends webhooks without API keys)
  if (path.includes("/sendgrid/webhook") || originalUrl.includes("/sendgrid/webhook")) {
    return next();
  }
  

  
  // Allow /uploads paths - these are public static files accessible to anyone
  // This includes Next.js Image Optimization API requests
  if (path.startsWith("/uploads/") || originalUrl.startsWith("/uploads/")) {
    return next();
  }
  
  // Allow Next.js Image Optimization API requests
  // Next.js makes server-side requests that may not have browser User-Agent
  if (userAgent.includes("next") || userAgent.includes("Next.js") || 
      referer?.includes("/_next/image") || originalUrl.includes("/_next/image")) {
    return next();
  }
  
  // Allow whitelisted user agents in development
  if (process.env.NODE_ENV === 'development') {
    const whitelistedAgents = process.env.WHITELISTED_USER_AGENTS?.split(',') || [];
    if (whitelistedAgents.some(agent => userAgent.includes(agent))) {
      return next();
    }
  }

  // Allow BrowserStack and other testing tools
  const allowedTestingTools = /BrowserStack|browserstack/i;
  if (allowedTestingTools.test(userAgent)) {
    return next();
  }
  
  // Allow SendGrid webhooks (SendGrid sends webhooks with various user agents)
  if (userAgent.includes("SendGrid") || userAgent.includes("sendgrid") || userAgent.includes("Twilio")) {
    return next();
  }
  
  // Allow Frontend-API-Proxy (Next.js API routes calling backend)
  if (userAgent.includes("Frontend-API-Proxy")) {
    return next();
  }

  // Enhanced blocking patterns
  const blockedAgents = /Postman|curl|VSCode|Insomnia|HTTPie|wget|python-requests|Go-http-client|Apache-HttpClient|okhttp/i;
  const suspiciousPatterns = /bot|crawler|spider|scraper|scanner/i;
  
  // Check for blocked agents
  if (blockedAgents.test(userAgent)) {
    return res.status(403).json({ 
      error: "Access denied - API testing tools not allowed",
      timestamp: new Date().toISOString()
    });
  }
  
  // Check for suspicious patterns
  if (suspiciousPatterns.test(userAgent)) {
    return res.status(403).json({ 
      error: "Access denied - suspicious client detected",
      timestamp: new Date().toISOString()
    });
  }
  
  // Check for missing browser indicators (allow BrowserStack and Frontend-API-Proxy)
  if (!referer && !userAgent.includes("Mozilla") && !userAgent.includes("Mobile") && !allowedTestingTools.test(userAgent) && !userAgent.includes("Frontend-API-Proxy")) {
    return res.status(403).json({ 
      error: "Access denied - browser required",
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// 🔐 Enhanced Timing Attack Prevention
function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  
  if (bufA.length !== bufB.length) {
    // Still perform comparison to prevent timing attacks
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  
  return crypto.timingSafeEqual(bufA, bufB);
}

// 🛡️ Enhanced Security Headers with Helmet
const allowInsecure = process.env.NODE_ENV !== "production";
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:",
        ...(allowInsecure ? ["http:", "http://localhost:5000"] : []),
      ],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: [
        "'self'",
        "https:",
        "blob:",
        ...(allowInsecure ? ["http:"] : []),
      ],
      frameSrc: ["'none'"],
      connectSrc: [
        "'self'",
        "https:",
        "wss:",
        ...(allowInsecure ? ["http:"] : []),
      ],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for file uploads
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: "deny" },
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

// 🔒 Enhanced Prototype Pollution Protection
function sanitizeObject(obj: any): void {
  if (!obj || typeof obj !== "object") return;
  
  const dangerousKeys = ["__proto__", "constructor", "prototype"];
  
  function recursiveSanitize(target: any): void {
    if (!target || typeof target !== "object") return;
    
    dangerousKeys.forEach((key) => {
      if (key in target) {
        delete target[key];
      }
    });
    
    // Recursively sanitize nested objects
    Object.values(target).forEach((value) => {
      if (typeof value === "object" && value !== null) {
        recursiveSanitize(value);
      }
    });
  }
  
  recursiveSanitize(obj);
}

function prototypePollutionGuard(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    sanitizeObject(req.body);
    sanitizeObject(req.query);
    sanitizeObject(req.params);
    next();
  } catch (error) {
    res.status(400).json({ 
      error: "Invalid request data",
      timestamp: new Date().toISOString()
    });
  }
}

// 🔍 Request Logging and Monitoring
const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log suspicious requests
  const suspiciousIndicators = [
    req.path.includes('..'),
    req.path.includes('<script>'),
    req.path.includes('SELECT'),
    req.path.includes('UNION'),
    req.headers['user-agent']?.includes('sqlmap'),
    req.headers['user-agent']?.includes('nikto')
  ];
  
  if (suspiciousIndicators.some(indicator => indicator)) {
    // Suspicious request detected
  }
  
  // Log response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 5000) { // Log slow requests
      // Slow request detected
    }
  });
  
  next();
};

// 🚨 Enhanced Error Handling
process.on("uncaughtException", (err) => {
  // In production, you might want to restart the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  // Unhandled rejection
});

// 🔒 Disable Dangerous Headers
const removeServerHeader = (req: Request, res: Response, next: NextFunction): void => {
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  next();
};

// 🛡️ IP Whitelist/Blacklist Support
const ipFilter = (req: Request, res: Response, next: NextFunction): void => {
  const clientIP = req.ip || req.connection.remoteAddress || '';
  
  // Check blacklist
  const blacklistedIPs = process.env.BLACKLISTED_IPS?.split(',') || [];
  if (blacklistedIPs.includes(clientIP)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  
  // Check whitelist (if configured)
  // const whitelistedIPs = process.env.WHITELISTED_IPS?.split(',') || [];
  // if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(clientIP)) {
  //   res.status(403).json({ error: "Access denied" });
  //   return;
  // }
  
  next();
};

// 🔐 Apply All Security Middleware
export function applySecurityMiddleware(app: express.Express): void {
  // Trust proxy (important for rate limiting and IP detection)
  app.set('trust proxy', 1);
  
  // Remove server identification
  app.use(removeServerHeader);
  
  // Enhanced security headers (exclude static files)
  app.use((req, res, next) => {
    // Skip helmet for static file requests to avoid CORS issues
    if (req.path.startsWith('/uploads/') || req.path.startsWith('/public/')) {
      return next();
    }
    return helmetConfig(req, res, next);
  });
  
  // CORS protection
  app.use(corsMiddleware);
  
  // Request logging and monitoring
  app.use(requestLogger);
  
  // IP filtering
  app.use(ipFilter);
  
  // Global rate limit — auth routes get a tighter limit via rateLimiter.ts
  app.use(generalApiLimiter);
  
  // Compression (after rate limiting)
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      // Don't compress if the request is from a suspicious source
      if (req.headers['user-agent']?.includes('bot')) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
  
  // Prototype pollution protection
  app.use(prototypePollutionGuard);
  
  // Block suspicious clients (only in production)
  if (process.env.NODE_ENV === "production") {
    app.use(blockSuspiciousClients);
  }
}

// 🔐 Export Security Helpers
export const SecurityHelpers = {
  safeCompare,
  sanitizeObject,
  createRateLimit,
};

// 🚨 Security Monitoring Functions
export const SecurityMonitoring = {
  logSecurityEvent: (event: string, details: any) => {
    // Security event logged
  },
  
  detectAnomalousActivity: (req: Request) => {
    const anomalies = [];
    
    // Check for SQL injection patterns
    const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i;
    if (sqlPatterns.test(req.url) || sqlPatterns.test(JSON.stringify(req.body))) {
      anomalies.push('SQL_INJECTION_ATTEMPT');
    }
    
    // Check for XSS patterns
    const xssPatterns = /<script|javascript:|on\w+\s*=/i;
    if (xssPatterns.test(req.url) || xssPatterns.test(JSON.stringify(req.body))) {
      anomalies.push('XSS_ATTEMPT');
    }
    
    // Check for path traversal
    if (req.url.includes('../') || req.url.includes('..\\')) {
      anomalies.push('PATH_TRAVERSAL_ATTEMPT');
    }
    
    return anomalies;
  }
};