import { NextResponse } from "next/server";
import { getCurrencyRates } from "@/lib/services/budget";

export const revalidate = 3600; // cache rates for 1 hour

const FALLBACK_RATES: Record<string, number> = {
  USD: 0.0091,
  EUR: 0.0084,
  GBP: 0.0071,
  INR: 0.76,
};

/**
 * GET /api/currency
 * Live BDT exchange rates from open.er-api.com (free, no API key).
 * Falls back to bundled approximate rates when the upstream is unreachable.
 */
export async function GET() {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/BDT", {
      next: { revalidate },
    });
    if (!response.ok) throw new Error("rate provider unavailable");
    const data = (await response.json()) as {
      result?: string;
      rates?: Record<string, number>;
      time_last_update_unix?: number;
    };
    if (data.result !== "success" || !data.rates) throw new Error("unexpected provider response");

    const rates: Record<string, number> = {};
    for (const code of Object.keys(FALLBACK_RATES)) {
      const value = data.rates[code];
      if (typeof value === "number" && value > 0) rates[code] = value;
    }
    if (Object.keys(rates).length === 0) throw new Error("no usable rates");

    return NextResponse.json({
      base: "BDT",
      rates,
      lastUpdated: data.time_last_update_unix
        ? new Date(data.time_last_update_unix * 1000).toISOString()
        : new Date().toISOString(),
      source: "open.er-api.com",
    });
  } catch (error) {
    console.error("Currency rates error:", error);
    return NextResponse.json({
      base: "BDT",
      rates: FALLBACK_RATES,
      lastUpdated: new Date().toISOString(),
      source: "fallback",
    });
  }
}

// keep the service import referenced for consistency with the fallback shape
void getCurrencyRates;
