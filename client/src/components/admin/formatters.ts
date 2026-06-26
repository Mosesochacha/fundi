const SYMBOLS: Record<string, string> = {
  KES: "KSh",
  USD: "$",
  GBP: "£",
  EUR: "€",
  NGN: "₦",
  GHS: "GH₵",
  UGX: "USh",
  TZS: "TSh",
};

/** Format an amount with its currency symbol, e.g. money(28400) → "KSh 28,400". */
export function money(amount: number, currency = "KES"): string {
  const sym = SYMBOLS[currency] ?? `${currency} `;
  return `${sym}${Math.round(amount).toLocaleString("en-US")}`;
}

/** "Jun 12, 2026" */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Jun 12, 2026, 2:30 PM" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Relative time, e.g. "3h ago", "2d ago". */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/** Truncate to n chars with an ellipsis. */
export function truncate(text: string, n = 60): string {
  return text.length > n ? `${text.slice(0, n).trimEnd()}…` : text;
}
