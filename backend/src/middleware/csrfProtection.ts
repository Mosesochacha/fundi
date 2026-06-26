import { Request, Response, NextFunction, RequestHandler } from "express";

export const csrfProtection: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next();
};

