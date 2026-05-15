import { Request, Response, NextFunction } from 'express';
import { RedisService, REDIS_KEYS } from '../config/redis';
import { sendError } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Safely get client IP with fallbacks
      const clientIp = req.ip || 
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
        req.connection.remoteAddress || 
        'unknown';
      
      const key = REDIS_KEYS.API_RATE_LIMIT(clientIp, req.route?.path || req.path);
      const windowStart = Math.floor(Date.now() / options.windowMs);
      const redisKey = `${key}:${windowStart}`;

      // Get current count
      const currentCount = await RedisService.get(redisKey) || 0;

      if (currentCount >= options.maxRequests) {
        return sendError(
          res,
          HTTP_STATUS.TOO_MANY_REQUESTS,
          options.message || 'Too many requests, please try again later.'
        );
      }

      // Increment counter
      await RedisService.increment(redisKey);
      
      // Set expiry if this is the first request in the window
      if (currentCount === 0) {
        await RedisService.setWithExpiry(redisKey, 1, Math.ceil(options.windowMs / 1000));
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': options.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, options.maxRequests - currentCount - 1).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + options.windowMs).toISOString(),
      });

      next();
    } catch (error) {
      // If Redis is down, allow the request to proceed
      next();
    }
  };
};

// Predefined rate limiters
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later.'
});

export const apiRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
  message: 'Too many API requests, please try again later.'
});

export const uploadRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 uploads per hour
  message: 'Too many uploads, please try again later.'
});

export const tipRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 tips per minute
  message: 'Too many tips sent, please wait before sending another.'
});