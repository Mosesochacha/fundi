import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_CONFIG, HTTP_STATUS } from "../utils/constants";
import { sendError } from "../utils/helpers";
import db from "../models";
import logger from "../utils/logger";

export interface AuthUserPayload extends JwtPayload {
  id: string;
  role: string;
  username?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: any; // or your specific user type
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

const verifyJWT: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    // Don't expose implementation details - generic error
    logger.warn("Authentication token missing", {
      path: req.path,
      ip: req.ip,
    });
    sendError(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      "Unauthorized: Access denied",
      { errorType: "NO_TOKEN" }
    );
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET) as AuthUserPayload;
    
    if (!decoded || typeof decoded !== "object") {
      logger.error("Invalid token format", { token: token });
      sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        "Unauthorized: Access denied",
        { errorType: "INVALID_TOKEN" }
      );
      return;
    }

    const { id, role, username } = decoded;

    // Verify user still exists and is active
    const user = await db.User.findByPk(id);
    if (!user) {
      sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        "Unauthorized: Access denied",
        { errorType: "USER_NOT_FOUND" }
      );
      return;
    }

    if (!user.isActive) {
      sendError(
        res,
        HTTP_STATUS.FORBIDDEN,
        "Access denied: Account is deactivated",
        { errorType: "ACCOUNT_DEACTIVATED" }
      );
      return;
    }

    const profile = await db.Profile.findOne({ where: { userId: id } });
    req.user = {
      id,
      role,
      username,
      isOnboarded: user.isOnboarded || false,
      profileId: profile?.id ?? null,
    };
    next();
  } catch (err: any) {
    // Log specific error types for debugging
    if (err.name === 'TokenExpiredError') {
      logger.warn("Token expired", { 
        expiredAt: err.expiredAt,
        currentTime: new Date().toISOString(),
        tokenPreview: token?.substring(0, 20) + "..."
      });
    } else if (err.name === 'JsonWebTokenError') {
      logger.warn("Invalid JWT token", { 
        message: err.message,
        tokenPreview: token?.substring(0, 20) + "..."
      });
    } else {
      logger.error("Token verification error", { 
        error: err.message,
        name: err.name,
        tokenPreview: token?.substring(0, 20) + "..."
      });
    }
    sendError(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      "Unauthorized: Access denied",
      { errorType: "INVALID_TOKEN" }
    );
    return;
  }
};

/**
 * Optional JWT verification middleware
 * Sets req.user if token is valid, but doesn't fail if token is missing
 * Useful for routes that work for both authenticated and anonymous users
 */
export const optionalVerifyJWT: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  // If no token, continue without setting req.user
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET) as AuthUserPayload;
    
    if (!decoded || typeof decoded !== "object") {
      // Invalid token, but continue without authentication
      return next();
    }

    const { id, role, username } = decoded;

    // Verify user still exists and is active
    const user = await db.User.findByPk(id);
    if (!user || !user.isActive) {
      // User not found or inactive, continue without authentication
      return next();
    }

    const profile = await db.Profile.findOne({ where: { userId: id } });
    req.user = {
      id,
      role,
      username,
      isOnboarded: user.isOnboarded || false,
      profileId: profile?.id ?? null,
    };
    next();
  } catch (err: any) {
    // Token invalid or expired, but continue without authentication
    next();
  }
};

export default verifyJWT;