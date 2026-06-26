// Country → currency and currency → symbol maps for geo detection and for
// deriving a display symbol when the client doesn't send one. No FX conversion.

export interface CountryCurrency {
  code: string;
  symbol: string;
}

export const currencyByCountry: Record<string, CountryCurrency> = {
  KE: { code: "KES", symbol: "KSh" },
  UG: { code: "UGX", symbol: "USh" },
  TZ: { code: "TZS", symbol: "TSh" },
  NG: { code: "NGN", symbol: "₦" },
  GH: { code: "GHS", symbol: "GH₵" },
  ZA: { code: "ZAR", symbol: "R" },
  ET: { code: "ETB", symbol: "Br" },
  RW: { code: "RWF", symbol: "Fr" },
  US: { code: "USD", symbol: "$" },
  GB: { code: "GBP", symbol: "£" },
  CA: { code: "CAD", symbol: "CA$" },
  AU: { code: "AUD", symbol: "A$" },
};

// Symbols for currencies we accept beyond the country map (matches the client).
const SYMBOL_BY_CODE: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", KES: "KSh", NGN: "₦", GHS: "GH₵",
  ZAR: "R", UGX: "USh", TZS: "TSh", INR: "₹", AED: "AED", CAD: "CA$",
  AUD: "A$", ETB: "Br", RWF: "Fr",
};

export function getCurrencyFromCountry(code?: string | null): CountryCurrency {
  if (!code) return { code: "USD", symbol: "$" };
  return currencyByCountry[code.toUpperCase()] ?? { code: "USD", symbol: "$" };
}

/** Best-effort symbol for a currency code (falls back to the code itself). */
export function symbolForCurrency(code?: string | null): string {
  if (!code) return "KSh";
  return SYMBOL_BY_CODE[code.toUpperCase()] ?? code.toUpperCase();
}
