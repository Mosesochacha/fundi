import { Request, Response, NextFunction, RequestHandler } from "express";

export const csrfProtection: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // All protected endpoints require Authorization: Bearer <token>.
  // Custom headers cannot be forged by cross-site requests, so CSRF does not apply.
  // Cookie-based auth (lot_a1) was removed — no double-submit check needed.
  next();
};


