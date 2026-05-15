import { Request, Response, NextFunction, RequestHandler } from "express";
import crypto from "crypto";
import { sendError } from "../utils/helpers";
import { HTTP_STATUS } from "../utils/constants";

const CSRF_COOKIE_NAME = "lot_c1";
const CSRF_HEADER_NAME = "x-csrf-token";
/** When set, browser sends JWT automatically — classic CSRF applies; require double-submit token. */
const ACCESS_COOKIE_NAME = "lot_a1";

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const csrfProtection: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  // Bearer token in Authorization header: cross-site requests cannot forge custom headers,
  // so CSRF does not apply regardless of whether the cookie is also present.
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // JWT only in Authorization: cross-site requests do not attach it; skip double-submit.
  if (!req.cookies?.[ACCESS_COOKIE_NAME]) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    sendError(res, HTTP_STATUS.FORBIDDEN, "Invalid CSRF token");
    return;
  }

  next();
};


