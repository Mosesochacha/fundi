import client from "@/lib/axios";
import { getCurrencyFromCountry } from "@/lib/currency";

export interface GeoCurrency {
  country: string;
  currency: string;
  symbol: string;
}

const FALLBACK: GeoCurrency = { country: "KE", currency: "KES", symbol: "KSh" };

/**
 * Detect the visitor's currency from their IP (GET /geo/detect). Falls back to
 * KES so the rate field always has a sensible default; the user can override.
 */
export async function detectCurrency(): Promise<GeoCurrency> {
  try {
    const res = await client.get("/geo/detect");
    const d = res.data?.data;
    if (d?.currency && d?.symbol) {
      return {
        country: d.country ?? "",
        currency: d.currency,
        symbol: d.symbol,
      };
    }
    if (d?.country) {
      const c = getCurrencyFromCountry(d.country);
      return { country: d.country, currency: c.code, symbol: c.symbol };
    }
  } catch {
    /* network/geo failure — fall through to default */
  }
  return FALLBACK;
}
