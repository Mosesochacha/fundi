/** Static reference data + helpers for the /browse page UI. */

import { symbolOf } from "@/lib/currency";

export interface TradeOption {
  name: string;
  emoji: string;
  count: string;
}

/** Trade list shown in the Trade dropdown (label === store value). */
export const TRADES: TradeOption[] = [
  { name: "Plumber", emoji: "🔧", count: "8.2k" },
  { name: "Electrician", emoji: "⚡", count: "6.1k" },
  { name: "Carpenter", emoji: "🪚", count: "5.4k" },
  { name: "Painter", emoji: "🎨", count: "3.9k" },
  { name: "Mason", emoji: "🧱", count: "4.8k" },
  { name: "House help", emoji: "🧹", count: "7.2k" },
  { name: "Mechanic", emoji: "🔩", count: "3.3k" },
  { name: "Gardener", emoji: "🌿", count: "2.1k" },
  { name: "Cleaner", emoji: "🧽", count: "4.1k" },
  { name: "Welder", emoji: "🔥", count: "2.8k" },
  { name: "AC Tech", emoji: "❄️", count: "1.9k" },
  { name: "Chef", emoji: "🍳", count: "1.4k" },
];

export interface CityOption {
  name: string;
  count: number;
}

export const CITIES: CityOption[] = [
  { name: "Nairobi", count: 142 },
  { name: "Lagos", count: 98 },
  { name: "London", count: 87 },
  { name: "Accra", count: 63 },
  { name: "Dubai", count: 51 },
];

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "best_match", label: "Best match" },
  { value: "top_rated", label: "Top rated" },
  { value: "most_experienced", label: "Most experienced" },
  { value: "most_jobs", label: "Most jobs done" },
];

export const RATING_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Any rating" },
  { value: 4.5, label: "4.5 & up" },
  { value: 4.8, label: "4.8 & up" },
];

export const EXP_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Any experience" },
  { value: 3, label: "3+ years" },
  { value: 5, label: "5+ years" },
  { value: 8, label: "8+ years" },
];

export const BUDGET_PRESETS: {
  label: string;
  min: number;
  max: number;
}[] = [
  { label: "Any budget", min: 500, max: 10000 },
  { label: "Under 2,000", min: 500, max: 2000 },
  { label: "2,000–4,000", min: 2000, max: 4000 },
  { label: "4,000+", min: 4000, max: 10000 },
];

/**
 * Trade → { banner, avatar, accent } tint. First keyword whose substring matches
 * the trade (case-insensitive) wins. `banner`/`avatar` are the soft cover/avatar
 * fills; `accent` is the saturated foreground used for the trade label + dot.
 * The fallback is a distinctly visible warm sand so EVERY card shows a real
 * banner - never something that blends into the page.
 */
const TRADE_TINTS: {
  keys: string[];
  banner: string;
  avatar: string;
  accent: string;
}[] = [
  { keys: ["plumb"], banner: "#E7EFE3", avatar: "#D9E6D2", accent: "#4F7A48" },
  {
    keys: ["electric"],
    banner: "#E4EAF2",
    avatar: "#D4DFEF",
    accent: "#46618F",
  },
  { keys: ["carp"], banner: "#F1EAD8", avatar: "#EADEC5", accent: "#896628" },
  { keys: ["paint"], banner: "#ECE5F1", avatar: "#E0D3EB", accent: "#6C5790" },
  {
    keys: ["tile", "mason"],
    banner: "#F2E7DC",
    avatar: "#EBD9C7",
    accent: "#A06A3A",
  },
  { keys: ["weld"], banner: "#E8E8EA", avatar: "#DADADE", accent: "#565A62" },
  {
    keys: ["mechanic", "mech", "motor"],
    banner: "#ECEEF2",
    avatar: "#D6DAE4",
    accent: "#5A6472",
  },
  {
    keys: ["garden", "landscap"],
    banner: "#E5EEE8",
    avatar: "#D5E5DB",
    accent: "#3C8567",
  },
  { keys: ["solar"], banner: "#E5EEE8", avatar: "#D5E5DB", accent: "#3C8567" },
  {
    keys: ["clean", "house", "help", "maid"],
    banner: "#F5F2E8",
    avatar: "#ECE4CF",
    accent: "#8A7A3A",
  },
  {
    keys: ["chef", "cook", "cater"],
    banner: "#F7EBE5",
    avatar: "#F0D8C9",
    accent: "#A0623A",
  },
  {
    keys: ["ac ", "air", "fridge", "hvac"],
    banner: "#E6F1F6",
    avatar: "#CFE4ED",
    accent: "#3C7E97",
  },
  {
    keys: ["design", "photo", "art"],
    banner: "#F1EAF6",
    avatar: "#E2D4EE",
    accent: "#6C5790",
  },
  {
    keys: ["software", "develop", "engineer", "tech", "it "],
    banner: "#E9EEF3",
    avatar: "#D2DCE6",
    accent: "#46618F",
  },
];

const DEFAULT_BANNER = "#EFE6D3";
const DEFAULT_AVATAR = "#E6D6B6";
const DEFAULT_ACCENT = "#8A6A2E";

function tintFor(trade: string) {
  const t = (trade ?? "").toLowerCase();
  return TRADE_TINTS.find((row) => row.keys.some((k) => t.includes(k)));
}

/** Soft pastel banner background per trade. Always returns a visible color. */
export function bannerColor(trade: string): string {
  return tintFor(trade)?.banner ?? DEFAULT_BANNER;
}

/** Slightly deeper tint of the banner color for the avatar background. */
export function avatarTint(trade: string): string {
  return tintFor(trade)?.avatar ?? DEFAULT_AVATAR;
}

/** Saturated foreground per trade - used for the trade label, dot and initials. */
export function tradeAccent(trade: string): string {
  return tintFor(trade)?.accent ?? DEFAULT_ACCENT;
}

/** Diagonal cover gradient (banner → avatar tint), matching the design. */
export function bannerGradient(trade: string): string {
  return `linear-gradient(120deg, ${bannerColor(trade)} 0%, ${avatarTint(trade)} 100%)`;
}

/** Money formatting for the rate pill. `currency` is an ISO 4217 code (e.g.
 * "USD"); it is mapped to its symbol via `symbolOf` (display-only). */
export function formatRate(currency: string, dailyRate: number): string {
  if (!dailyRate || dailyRate <= 0) return "Rate on request";
  return `${symbolOf(currency)} ${dailyRate.toLocaleString()}`;
}
