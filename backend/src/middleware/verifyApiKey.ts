import { Request, Response, NextFunction, RequestHandler } from "express";
import { HTTP_STATUS } from "../utils/constants";
import { sendError } from "../utils/helpers";
import logger from "../utils/logger";

export interface ApiKeyRequest extends Request {
  apiKey?: string;
  apiKeyService?: string;
}

const verifyApiKey: RequestHandler = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let apiKey: string | undefined;

  if (req.headers["x-api-key"]) {
    apiKey = req.headers["x-api-key"] as string;
  }
  else if (req.headers["authorization"]) {
    const authHeader = req.headers["authorization"];
    if (authHeader.startsWith("api-key:")) {
      apiKey = authHeader.replace("api-key:", "").trim();
    } else if (authHeader.startsWith("Bearer api-key:")) {
      apiKey = authHeader.replace("Bearer api-key:", "").trim();
    }
  }

  if (!apiKey) {
    logger.warn("API key missing", {
      path: req.path,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    sendError(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      "Unauthorized: Access denied",
      { errorType: "NO_API_KEY" }
    );
    return;
  }

  const validKeys: { [key: string]: string } = {
    newsletter: process.env.API_KEY_NEWSLETTER_SERVER || "",
    public: process.env.API_KEY_PUBLIC || "",
    youtopia: process.env.API_KEY_YOUTOPIA || "",
  };

  let matchedService: string | null = null;
  for (const [service, key] of Object.entries(validKeys)) {
    if (key && key === apiKey) {
      matchedService = service;
      break;
    }
  }

  if (!matchedService) {
    logger.warn("Invalid API key attempted", {
      keyPreview: apiKey.substring(0, 10) + "...",
      ip: req.ip,
      path: req.path,
      userAgent: req.headers["user-agent"],
    });
    sendError(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      "Unauthorized: Access denied",
      { errorType: "INVALID_API_KEY" }
    );
    return;
  }

  req.apiKey = apiKey;
  req.apiKeyService = matchedService;

  logger.info("API key authenticated", {
    service: matchedService,
    path: req.path,
    ip: req.ip,
  });

  next();
};

export const verifyJWTOrApiKey: RequestHandler = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const hasApiKey =
    req.headers["x-api-key"] ||
    (req.headers["authorization"] &&
      (req.headers["authorization"].startsWith("api-key:") ||
        req.headers["authorization"].startsWith("Bearer api-key:")));

  if (hasApiKey) {
    return verifyApiKey(req, res, next);
  } else {
    const verifyJWT = (await import("./verifyJWT")).default;
    return verifyJWT(req, res, next);
  }
};

export const optionalApiKey: RequestHandler = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let apiKey: string | undefined;

  if (req.headers["x-api-key"]) {
    apiKey = req.headers["x-api-key"] as string;
  }
  else if (req.headers["authorization"]) {
    const authHeader = req.headers["authorization"];
    if (authHeader.startsWith("api-key:")) {
      apiKey = authHeader.replace("api-key:", "").trim();
    } else if (authHeader.startsWith("Bearer api-key:")) {
      apiKey = authHeader.replace("Bearer api-key:", "").trim();
    }
  }

  if (!apiKey) {
    return next();
  }

  const validKeys: { [key: string]: string } = {
    newsletter: process.env.API_KEY_NEWSLETTER_SERVER || "",
    public: process.env.API_KEY_PUBLIC || "",
    youtopia: process.env.API_KEY_YOUTOPIA || "",
  };

  let matchedService: string | null = null;
  for (const [service, key] of Object.entries(validKeys)) {
    if (key && key === apiKey) {
      matchedService = service;
      break;
    }
  }

  if (matchedService) {
    req.apiKey = apiKey;
    req.apiKeyService = matchedService;
    logger.info("API key authenticated (optional)", {
      service: matchedService,
      path: req.path,
      ip: req.ip,
    });
  } else {
    logger.warn("Invalid API key provided (optional middleware)", {
      keyPreview: apiKey.substring(0, 10) + "...",
      ip: req.ip,
      path: req.path,
    });
  }

  next();
};

export default verifyApiKey;
