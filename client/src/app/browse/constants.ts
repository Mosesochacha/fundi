/** Static reference data + helpers for the /browse page UI. */

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
  { value: "most_jobs", label: "Most jobs" },
  { value: "rate_asc", label: "Rate: low to high" },
  { value: "rate_desc", label: "Rate: high to low" },
];

export const RATING_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Any" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
  { value: 4.5, label: "4.5+" },
];

export const EXP_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Any" },
  { value: 1, label: "1+ yr" },
  { value: 3, label: "3+ yrs" },
  { value: 5, label: "5+ yrs" },
];

export const BUDGET_PRESETS: {
  label: string;
  min: number;
  max: number;
}[] = [
  { label: "Any budget", min: 500, max: 10000 },
  { label: "Under KSh 2,000", min: 500, max: 2000 },
  { label: "KSh 2,000–4,000", min: 2000, max: 4000 },
  { label: "KSh 4,000+", min: 4000, max: 10000 },
];

/**
 * Trade → [banner, avatar] tint. First keyword whose substring matches the
 * trade (case-insensitive) wins. The fallback is a distinctly visible warm sand
 * so EVERY card shows a real banner — never something that blends into the page.
 */
const TRADE_TINTS: { keys: string[]; banner: string; avatar: string }[] = [
  { keys: ["plumb"], banner: "#eef3e8", avatar: "#dde8cf" },
  { keys: ["electric"], banner: "#e8eef5", avatar: "#d4e2f0" },
  { keys: ["carp"], banner: "#f5ebe8", avatar: "#ecd8d0" },
  { keys: ["paint"], banner: "#ece8f5", avatar: "#ddd2f0" },
  { keys: ["tile", "mason"], banner: "#e8f5ee", avatar: "#cfeede" },
  { keys: ["weld"], banner: "#f6ece2", avatar: "#eed9c4" },
  { keys: ["mechanic", "mech", "motor"], banner: "#eceef2", avatar: "#d6dae4" },
  { keys: ["garden", "landscap"], banner: "#e9f3e6", avatar: "#cfe6c9" },
  { keys: ["clean", "house", "help", "maid"], banner: "#f5f2e8", avatar: "#ece4cf" },
  { keys: ["chef", "cook", "cater"], banner: "#f7ebe5", avatar: "#f0d8c9" },
  { keys: ["ac ", "air", "fridge", "hvac"], banner: "#e6f1f6", avatar: "#cfe4ed" },
  { keys: ["design", "photo", "art"], banner: "#f1eaf6", avatar: "#e2d4ee" },
  { keys: ["software", "develop", "engineer", "tech", "it "], banner: "#e9eef3", avatar: "#d2dce6" },
];

const DEFAULT_BANNER = "#efe6d3";
const DEFAULT_AVATAR = "#e6d6b6";

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

/** Money formatting for the rate pill. */
export function formatRate(currency: string, dailyRate: number): string {
  if (!dailyRate || dailyRate <= 0) return "Rate on request";
  const prefix = currency || "KSh";
  return `${prefix} ${dailyRate.toLocaleString()}`;
}
