import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../utils/helpers";
import { getCurrencyFromCountry } from "../utils/currencyMap";
import logger from "../utils/logger";

const DEFAULT_COUNTRY = "KE"; // primary market — used when detection fails

function clientIp(req: Request): string | null {
  const fwd = (req.headers["x-forwarded-for"] as string) || "";
  const ip = fwd.split(",")[0].trim() || req.socket?.remoteAddress || "";
  // Strip IPv6 loopback / mapped prefixes; skip private/local addresses.
  const clean = ip.replace(/^::ffff:/, "");
  if (!clean || clean === "::1" || clean.startsWith("127.") || clean.startsWith("10.") || clean.startsWith("192.168.")) {
    return null;
  }
  return clean;
}

/** Look up an ISO country for an IP via ip-api.com (free, no key). */
async function countryFromIp(ip: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,countryCode`,
      { signal: controller.signal },
    );
    clearTimeout(t);
    if (!res.ok) return null;
    const data: any = await res.json();
    return data?.status === "success" && data.countryCode ? data.countryCode : null;
  } catch {
    return null;
  }
}

class GeoController {
  /** GET /geo/detect — { country, currency, symbol } from CF header or IP. */
  detect = asyncHandler(async (req: Request, res: Response) => {
    // 1) Cloudflare edge header (zero cost when fronted by Cloudflare).
    let country = (req.headers["cf-ipcountry"] as string) || "";
    country = country && country !== "XX" ? country.toUpperCase() : "";

    // 2) Fall back to an IP geo lookup.
    if (!country) {
      const ip = clientIp(req);
      if (ip) {
        const detected = await countryFromIp(ip);
        if (detected) country = detected.toUpperCase();
      }
    }

    // 3) Default to the primary market.
    if (!country) country = DEFAULT_COUNTRY;

    const cur = getCurrencyFromCountry(country);
    logger.info("Geo detect", { country, currency: cur.code });
    return sendSuccess(res, "Detected location", {
      country,
      currency: cur.code,
      symbol: cur.symbol,
    });
  });
}

export default new GeoController();
