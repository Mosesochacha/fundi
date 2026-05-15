import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./verifyJWT";
import { HTTP_STATUS } from "../utils/constants";
import { sendError } from "../utils/helpers";

/**
 * Role-based access control middleware.
 * Usage: router.get('/admin', verifyJWT, requireRole('admin'), handler)
 */
const requireRole = (...allowedRoles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        HTTP_STATUS.FORBIDDEN,
        "Forbidden: insufficient permissions",
        { errorType: "INSUFFICIENT_PERMISSIONS", requiredRoles: allowedRoles }
      );
      return;
    }
    next();
  };
};

export default requireRole;