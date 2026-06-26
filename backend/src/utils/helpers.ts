import crypto from 'crypto';
import { Response } from 'express';
import { HTTP_STATUS, RESPONSE_MESSAGES, CUSTOM_STATUS_CODES, CUSTOM_STATUS_MESSAGES } from './constants';
import logger from './logger';

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Safe string comparison to prevent timing attacks
 */
export const safeCompare = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Generate secure random token
 */
export const generateSecureToken = (length: number = 64): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash string using SHA256
 */
export const hashString = (str: string): string => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

/**
 * Capitalize first letter of a string
 */
export const capitalizeFirst = (str: string): string => {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Standard API response helper
 */
export const sendResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data?: any,
  error?: string,
  customCode?: number
) => {
  const response: any = {
    success: statusCode < 400,
    message,
    timestamp: new Date().toISOString(),
  };

  if (customCode !== undefined) {
    response.code = customCode;
  }

  if (data !== undefined) {
    response.data = data;
  }

  if (error !== undefined) {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

/**
 * Success response helper
 */
export const sendSuccess = (res: Response, message: string, data?: any) => {
  return sendResponse(res, HTTP_STATUS.OK, message, data);
};

/**
 * Error response helper
 * Removes sensitive technical details (like errorType) from user-facing responses
 */
export const sendError = (
  res: Response, 
  statusCode: number, 
  message: string, 
  data?: any, 
  error?: string,
  customCode?: number
) => {
  let sanitizedData = data;
  if (data && typeof data === 'object') {
    const { errorType, ...rest } = data;
    sanitizedData = Object.keys(rest).length > 0 ? rest : undefined;
  }
  
  return sendResponse(res, statusCode, message, sanitizedData, error, customCode);
};

/**
 * Send error with custom status code (similar to Safaricom's approach)
 * Automatically includes the custom code message if available
 */
export const sendCustomError = (
  res: Response,
  httpStatusCode: number,
  customCode: number,
  message?: string,
  data?: any
) => {
  const errorMessage = message || CUSTOM_STATUS_MESSAGES[customCode] || 'An error occurred';
  
  return sendError(
    res,
    httpStatusCode,
    errorMessage,
    {
      ...data,
      redirectTo: customCode === CUSTOM_STATUS_CODES.ONBOARDING_NOT_COMPLETED ? '/onboarding' : undefined,
    },
    undefined,
    customCode
  );
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Generate pagination metadata
 */
export const getPaginationMeta = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Format user data for response (remove sensitive fields)
 */
export const formatUserResponse = (user: any) => {
  const { passwordHash, ...userWithoutPassword } = user.toJSON ? user.toJSON() : user;
  return userWithoutPassword;
};

/**
 * Generate JWT payload
 */
export const generateJWTPayload = (user: any) => {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
  };
};

/**
 * Calculate token expiration date
 */
export const getTokenExpirationDate = (days: number): Date => {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

/**
 * Convert days to milliseconds
 */
export const daysToMilliseconds = (days: number): number => {
  return days * 24 * 60 * 60 * 1000;
};

export const logError = (error: any, context: string) => {
};

/**
 * Async error handler wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      const logger = require('./logger').default;
      
      logger.error('Unhandled error in asyncHandler:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        body: req.body,
        params: req.params,
        query: req.query,
        timestamp: new Date().toISOString()
      });
      
      next(error);
    });
  };
};

export function extractFirstName(displayName?: string): string {
  if (!displayName) return "";

  let name = displayName.trim();
  name = name.split("|")[0];
  name = name.split("-")[0];
  name = name.split("(")[0];
  name = name.replace(/\s+/g, " ").trim();

  const first = name.split(" ")[0];
  const companyWords = ["ltd", "limited", "inc", "llc", "company", "co"];
  if (companyWords.includes(first.toLowerCase())) {
    return "";
  }

  return first;
}

export const paginate = (page: number, limit: number) => ({
  skip: (page - 1) * limit,
  take: limit,
});

export function adjustIsFeaturedForOrganization(opportunity: any, requestingOrgId?: string | null, lotOrgId?: string | null): any {
  if (!opportunity) return opportunity;

  const opp = opportunity.toJSON ? opportunity.toJSON() : opportunity;

  if (opp.featuredOrganizations && Array.isArray(opp.featuredOrganizations)) {
    if (!requestingOrgId && !lotOrgId) {
      return opp;
    }

    let isFeaturedForOrg = false;
    
    if (requestingOrgId) {
      isFeaturedForOrg = opp.featuredOrganizations.includes(requestingOrgId);
    } else if (lotOrgId) {
      isFeaturedForOrg = opp.featuredOrganizations.includes(lotOrgId);
    }
    
    return {
      ...opp,
      isFeatured: isFeaturedForOrg
    };
  }

  return opp;
}

export function adjustIsFeaturedForOrganizationArray(opportunities: any[], requestingOrgId?: string | null, lotOrgId?: string | null): any[] {
  if (!opportunities || !Array.isArray(opportunities)) {
    return opportunities;
  }

  return opportunities.map(opp => adjustIsFeaturedForOrganization(opp, requestingOrgId, lotOrgId));
}

