import { Request, Response } from "express";
import jwt from "jsonwebtoken";

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

export function clearAuthCookies(res: Response, req?: Request) {
  const currentDomain = getCookieDomain(req);
  res.clearCookie("lot_a1", { path: "/", domain: currentDomain });
  res.clearCookie("lot_r1", { path: "/", domain: currentDomain });
  res.clearCookie("lot_c1", { path: "/", domain: currentDomain });
  
  res.clearCookie("lot_a1", { path: "/" });
  res.clearCookie("lot_r1", { path: "/" });
  res.clearCookie("lot_c1", { path: "/" });
}
