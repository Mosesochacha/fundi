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

/** Resolve an ISO country code to its currency, defaulting to USD. */
export function getCurrencyFromCountry(code?: string | null): CountryCurrency {
  if (!code) return { code: "USD", symbol: "$" };
  return currencyByCountry[code.toUpperCase()] ?? { code: "USD", symbol: "$" };
}

const LOCATION_TO_COUNTRY: Record<string, string> = {
  kenya: "KE",
  uganda: "UG",
  tanzania: "TZ",
  nigeria: "NG",
  ghana: "GH",
  "south africa": "ZA",
  ethiopia: "ET",
  rwanda: "RW",
  "united states": "US",
  usa: "US",
  america: "US",
  "united kingdom": "GB",
  uk: "GB",
  britain: "GB",
  england: "GB",
  scotland: "GB",
  canada: "CA",
  australia: "AU",
  nairobi: "KE",
  mombasa: "KE",
  kisumu: "KE",
  nakuru: "KE",
  eldoret: "KE",
  thika: "KE",
  kampala: "UG",
  "dar es salaam": "TZ",
  dodoma: "TZ",
  arusha: "TZ",
  lagos: "NG",
  abuja: "NG",
  kano: "NG",
  ibadan: "NG",
  accra: "GH",
  kumasi: "GH",
  johannesburg: "ZA",
  "cape town": "ZA",
  durban: "ZA",
  pretoria: "ZA",
  "addis ababa": "ET",
  kigali: "RW",
  london: "GB",
  manchester: "GB",
  birmingham: "GB",
  "new york": "US",
  "los angeles": "US",
  chicago: "US",
  houston: "US",
  toronto: "CA",
  vancouver: "CA",
  montreal: "CA",
  sydney: "AU",
  melbourne: "AU",
  brisbane: "AU",
};

/** Best-effort ISO country code from a free-text location, or null. */
export function detectCountryFromLocation(location: string): string | null {
  const s = location.toLowerCase();
  for (const [needle, code] of Object.entries(LOCATION_TO_COUNTRY)) {
    if (s.includes(needle)) return code;
  }
  return null;
}
