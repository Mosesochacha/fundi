/* ─────────────────────────────────────────────────────────────────────────
   Currency catalogue + helpers.

   Currency is a per-user preference (saved to the profile via the backend).
   There is NO FX conversion - only the displayed SYMBOL changes. Each amount
   is shown in its owner's currency.
   ───────────────────────────────────────────────────────────────────────── */

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "UGX", symbol: "USh", name: "Ugandan Shilling" },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "AED", symbol: "AED", name: "UAE Dirham" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
];

export const DEFAULT_CURRENCY = "USD";

const DEFAULT_SYMBOL =
  CURRENCIES.find((c) => c.code === DEFAULT_CURRENCY)?.symbol ?? "$";

/** Resolve a currency code to its symbol, falling back to the default's. */
export function symbolOf(code?: string | null): string {
  if (!code) return DEFAULT_SYMBOL;
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? DEFAULT_SYMBOL;
}

/** Format an amount with the right symbol and thousands separators. */
export function formatMoney(
  code: string | null | undefined,
  amount: number,
): string {
  return `${symbolOf(code)}${amount.toLocaleString("en-US")}`;
}
