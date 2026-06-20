import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_CONFIG } from "./constants";

function isCrossOrigin(req?: Request) {
  if (!req) return false;

  const origin = req.get("origin");
  const host = req.get("host");
  if (!origin || !host) return false;

  try {
    const originHostname = new URL(origin).hostname;
    const hostHostname = host.split(":")[0];

    // Treat subdomains of the same root domain as same-site
    const getRootDomain = (h: string) => {
      const parts = h.split(".");
      if (parts.length <= 2) return h;
      return parts.slice(-2).join(".");
    };

    const originRoot = getRootDomain(originHostname);
    const hostRoot = getRootDomain(hostHostname);

    // Same exact host or same root domain → not cross-origin for cookie purposes
    if (originHostname === hostHostname || originRoot === hostRoot) {
      return false;
    }

    // Different sites → treat as cross-origin
    return true;
  } catch {
    return false;
  }
}

function getCookieDomain(req?: Request) {
  if (process.env.NODE_ENV !== "production") return undefined;
  const domain = process.env.COOKIE_DOMAIN;
  if (!domain) return undefined;
  return domain.startsWith(".") ? domain : `.${domain}`;
}

function getMaxAgeFromJWT(token: string, fallbackMs: number) {
  try {
    const decoded: any = jwt.decode(token);
    if (decoded?.exp) {
      return Math.max(0, decoded.exp * 1000 - Date.now());
    }
  } catch {}
  return fallbackMs;
}

export function setAuthCookie(
  res: Response,
  name: "lot_a1" | "lot_r1",
  token: string,
  req?: Request,
  fallbackMs = 15 * 60 * 1000
) {
  const crossSite = isCrossOrigin(req);
  const isProduction = process.env.NODE_ENV === "production";
  const isSecure = req?.secure || req?.headers["x-forwarded-proto"] === "https" || isProduction;
  

  const sameSite = crossSite ? (isSecure ? "none" : "lax") : "lax";
  const secure = crossSite ? isSecure : isProduction;

  res.cookie(name, token, {
    httpOnly: true,
    secure: secure,
    sameSite: sameSite as "none" | "lax" | "strict",
    path: "/",
    domain: getCookieDomain(req),
    maxAge: getMaxAgeFromJWT(token, fallbackMs),
  });
}

export function setCsrfCookie(res: Response, token: string, req?: Request) {
  const crossSite = isCrossOrigin(req);
  const isProduction = process.env.NODE_ENV === "production";
  const isSecure = req?.secure || req?.headers["x-forwarded-proto"] === "https" || isProduction;

  const sameSite = crossSite ? (isSecure ? "none" : "lax") : "lax";
  const secure = crossSite ? isSecure : isProduction;

  res.cookie("lot_c1", token, {
    httpOnly: false,
    secure: secure,
    sameSite: sameSite as "none" | "lax" | "strict",
    path: "/",
    domain: getCookieDomain(req),
    maxAge: 12 * 60 * 60 * 1000,
  });
}

// ── Pending email verification ──────────────────────────────────────────────
// During registration (and when an unverified user asks to verify) we stash the
// email being verified in a short-lived, signed, httpOnly cookie instead of
// passing it through the URL. The /verify-email and /resend-verification
// endpoints read the email from here, so it never appears in a query string,
// browser history, or a shareable link.
const PENDING_VERIFICATION_COOKIE = "lot_pv";
const PENDING_VERIFICATION_TTL_MS = 15 * 60 * 1000; // 15 minutes

export interface PendingVerification {
  email: string;
  accountType?: "employer" | "worker" | null;
}

// Shared cross-site cookie attributes (same logic the auth cookies use).
function cookieSecurity(req?: Request) {
  const crossSite = isCrossOrigin(req);
  const isProduction = process.env.NODE_ENV === "production";
  const isSecure =
    req?.secure || req?.headers["x-forwarded-proto"] === "https" || isProduction;
  const sameSite = crossSite ? (isSecure ? "none" : "lax") : "lax";
  const secure = crossSite ? isSecure : isProduction;
  return { sameSite: sameSite as "none" | "lax" | "strict", secure };
}

export function setPendingVerificationCookie(
  res: Response,
  payload: PendingVerification,
  req?: Request
) {
  const token = jwt.sign(
    { email: payload.email, accountType: payload.accountType ?? null },
    JWT_CONFIG.SECRET as string,
    { expiresIn: "15m" }
  );
  const { sameSite, secure } = cookieSecurity(req);
  res.cookie(PENDING_VERIFICATION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    domain: getCookieDomain(req),
    maxAge: PENDING_VERIFICATION_TTL_MS,
  });
}

// Returns the email/accountType from a valid pending-verification cookie, or
// null when it is missing, malformed, or expired.
export function readPendingVerification(req: Request): PendingVerification | null {
  const token = (req as any).cookies?.[PENDING_VERIFICATION_COOKIE];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET as string) as any;
    if (!decoded?.email) return null;
    return { email: String(decoded.email), accountType: decoded.accountType ?? null };
  } catch {
    return null;
  }
}

export function clearPendingVerificationCookie(res: Response, req?: Request) {
  const currentDomain = getCookieDomain(req);
  res.clearCookie(PENDING_VERIFICATION_COOKIE, { path: "/", domain: currentDomain });
  res.clearCookie(PENDING_VERIFICATION_COOKIE, { path: "/" });
}

export function clearAuthCookies(res: Response, req?: Request) {
  const currentDomain = getCookieDomain(req);
  res.clearCookie("lot_a1", { path: "/", domain: currentDomain });
  res.clearCookie("lot_r1", { path: "/", domain: currentDomain });
  res.clearCookie("lot_c1", { path: "/", domain: currentDomain });
  
  res.clearCookie("lot_a1", { path: "/" });
  res.clearCookie("lot_r1", { path: "/" });
  res.clearCookie("lot_c1", { path: "/" });
}
