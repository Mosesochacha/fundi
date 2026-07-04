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
  user?: any;
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

    const { id, username } = decoded;

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

    if (user.status === "suspended") {
      sendError(
        res,
        HTTP_STATUS.FORBIDDEN,
        "Your account has been suspended. Contact support.",
        { errorType: "ACCOUNT_SUSPENDED" }
      );
      return;
    }

    const profile = await db.Profile.findOne({ where: { userId: id } });
    req.user = {
      id,
      role: user.role,
      accountType: user.accountType ?? null,
      username,
      isOnboarded: user.isOnboarded || false,
      profileId: profile?.id ?? null,
    };
    next();
  } catch (err: any) {
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

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET) as AuthUserPayload;
    
    if (!decoded || typeof decoded !== "object") {
      return next();
    }

    const { id, username } = decoded;

    const user = await db.User.findByPk(id);
    if (!user || !user.isActive || user.status === "suspended") {
      return next();
    }

    const profile = await db.Profile.findOne({ where: { userId: id } });
    req.user = {
      id,
      role: user.role,
      accountType: user.accountType ?? null,
      username,
      isOnboarded: user.isOnboarded || false,
      profileId: profile?.id ?? null,
    };
    next();
  } catch (err: any) {
    next();
  }
};

export default verifyJWT;