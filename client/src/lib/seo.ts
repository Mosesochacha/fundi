/**
 * Shared SEO config + slug helpers used by metadata, sitemap, robots and the
 * /browse/[trade]/[location] routes. Keep this framework-agnostic (no React)
 * so it can be imported from server components and route handlers alike.
 */

import { CITIES, TRADES } from "@/app/browse/constants";

/** Canonical public origin. Override per-env with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://tesilix.com"
).replace(/\/$/, "");

/** Absolute URL for a site-relative path. */
export const absoluteUrl = (path = "/") =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Lowercase, strip punctuation, spaces/commas → single hyphens. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "AC Tech" → "ac-tech", "House help" → "house-help". */
export const tradeSlug = (label: string) => slugify(label);

/** "Westlands, Nairobi" → "westlands-nairobi", "Nairobi" → "nairobi". */
export const locationSlug = (label: string) => slugify(label);

const titleCase = (s: string) =>
  s
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/** Canonical trade names (the browse Trade dropdown is the source of truth). */
export const TRADE_NAMES: string[] = TRADES.map((t) => t.name);
export const CITY_NAMES: string[] = CITIES.map((c) => c.name);

/**
 * Resolve a trade slug back to its canonical display label (preserving casing
 * like "AC Tech"); falls back to title-casing an unknown slug.
 */
export function formatTrade(slug: string): string {
  const match = TRADE_NAMES.find((name) => tradeSlug(name) === slug);
  return match ?? titleCase(slug);
}

/** Resolve a location slug to a display label; title-cased when unknown. */
export function formatLocation(slug: string): string {
  const match = CITY_NAMES.find((name) => locationSlug(name) === slug);
  return match ?? titleCase(slug);
}

/** Simple pluralization for headings, e.g. "Plumber" → "Plumbers". */
export const pluralizeTrade = (label: string) =>
  /s$/i.test(label) ? label : `${label}s`;
