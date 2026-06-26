import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import logger from "../utils/logger";

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
    keyGenerator: (req) => {
      return req.ip || 
             req.headers['x-forwarded-for']?.toString().split(',')[0] || 
             req.connection.remoteAddress || 
             'unknown';
    },
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
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
  60 * 1000,
  300,
  "Too many requests, please slow down."
);

let organizationDomainsCache: string[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;

const corsMiddleware = cors({
  origin: async (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const originHostname = origin.replace(/^https?:\/\//, '').split(':')[0];

    const allowedOrigins = process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : [];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const matchesOrganization = organizationDomainsCache.some(domainHostname => {
      return domainHostname === originHostname;
    });
    
    if (matchesOrganization) {
      return callback(null, true);
    }
    
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
    'x-api-key',
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
  maxAge: 86400
});

const blockSuspiciousClients = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const path = req.path || "";
  const originalUrl = req.originalUrl || "";

  if (path === "/healthz" || originalUrl === "/healthz") {
    return next();
  }

  const userAgent = req.get("User-Agent") || "";
  const referer = req.get("Referer") || "";
  const apiKey = req.headers["x-api-key"] || req.headers["authorization"] || req.get("X-API-Key");
  
  if (apiKey) {
    return next();
  }
  
  if (path.includes("/sendgrid/webhook") || originalUrl.includes("/sendgrid/webhook")) {
    return next();
  }

  if (path.startsWith("/uploads/") || originalUrl.startsWith("/uploads/")) {
    return next();
  }
  
  if (userAgent.includes("next") || userAgent.includes("Next.js") || 
      referer?.includes("/_next/image") || originalUrl.includes("/_next/image")) {
    return next();
  }
  
  if (process.env.NODE_ENV === 'development') {
    const whitelistedAgents = process.env.WHITELISTED_USER_AGENTS?.split(',') || [];
    if (whitelistedAgents.some(agent => userAgent.includes(agent))) {
      return next();
    }
  }

  const allowedTestingTools = /BrowserStack|browserstack/i;
  if (allowedTestingTools.test(userAgent)) {
    return next();
  }
  
  if (userAgent.includes("SendGrid") || userAgent.includes("sendgrid") || userAgent.includes("Twilio")) {
    return next();
  }
  
  if (userAgent.includes("Frontend-API-Proxy")) {
    return next();
  }

  const blockedAgents = /Postman|curl|VSCode|Insomnia|HTTPie|wget|python-requests|Go-http-client|Apache-HttpClient|okhttp/i;
  const suspiciousPatterns = /bot|crawler|spider|scraper|scanner/i;
  
  if (blockedAgents.test(userAgent)) {
    return res.status(403).json({ 
      error: "Access denied - API testing tools not allowed",
      timestamp: new Date().toISOString()
    });
  }
  
  if (suspiciousPatterns.test(userAgent)) {
    return res.status(403).json({ 
      error: "Access denied - suspicious client detected",
      timestamp: new Date().toISOString()
    });
  }
  
  if (!referer && !userAgent.includes("Mozilla") && !userAgent.includes("Mobile") && !allowedTestingTools.test(userAgent) && !userAgent.includes("Frontend-API-Proxy")) {
    return res.status(403).json({ 
      error: "Access denied - browser required",
      timestamp: new Date().toISOString()
    });
  }

  next();
};

function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  
  return crypto.timingSafeEqual(bufA, bufB);
}

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
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: "deny" },
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

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

const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  const suspiciousIndicators = [
    req.path.includes('..'),
    req.path.includes('<script>'),
    req.path.includes('SELECT'),
    req.path.includes('UNION'),
    req.headers['user-agent']?.includes('sqlmap'),
    req.headers['user-agent']?.includes('nikto')
  ];
  
  if (suspiciousIndicators.some(indicator => indicator)) {
  }
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 5000) {
    }
  });
  
  next();
};

process.on("uncaughtException", (err) => {
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason, promise) => {
});

const removeServerHeader = (req: Request, res: Response, next: NextFunction): void => {
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  next();
};

const ipFilter = (req: Request, res: Response, next: NextFunction): void => {
  const clientIP = req.ip || req.connection.remoteAddress || '';
  
  const blacklistedIPs = process.env.BLACKLISTED_IPS?.split(',') || [];
  if (blacklistedIPs.includes(clientIP)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  next();
};

export function applySecurityMiddleware(app: express.Express): void {
  app.set('trust proxy', 1);
  
  app.use(removeServerHeader);
  
  app.use((req, res, next) => {
    if (req.path.startsWith('/uploads/') || req.path.startsWith('/public/')) {
      return next();
    }
    return helmetConfig(req, res, next);
  });
  
  app.use(corsMiddleware);
  
  app.use(requestLogger);
  
  app.use(ipFilter);
  
  app.use(generalApiLimiter);
  
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['user-agent']?.includes('bot')) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
  
  app.use(prototypePollutionGuard);
  
  if (process.env.NODE_ENV === "production") {
    app.use(blockSuspiciousClients);
  }
}

export const SecurityHelpers = {
  safeCompare,
  sanitizeObject,
  createRateLimit,
};

export const SecurityMonitoring = {
  logSecurityEvent: (event: string, details: any) => {
  },
  
  detectAnomalousActivity: (req: Request) => {
    const anomalies = [];
    
    const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i;
    if (sqlPatterns.test(req.url) || sqlPatterns.test(JSON.stringify(req.body))) {
      anomalies.push('SQL_INJECTION_ATTEMPT');
    }
    
    const xssPatterns = /<script|javascript:|on\w+\s*=/i;
    if (xssPatterns.test(req.url) || xssPatterns.test(JSON.stringify(req.body))) {
      anomalies.push('XSS_ATTEMPT');
    }
    
    if (req.url.includes('../') || req.url.includes('..\\')) {
      anomalies.push('PATH_TRAVERSAL_ATTEMPT');
    }
    
    return anomalies;
  }
};