"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Badge, DataStatusBadge } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";

interface RatesResponse {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
  source: string;
}

const currencyOptions = [
  { value: "USD", label: "🇺🇸 USD — US Dollar" },
  { value: "EUR", label: "🇪🇺 EUR — Euro" },
  { value: "GBP", label: "🇬🇧 GBP — British Pound" },
  { value: "INR", label: "🇮🇳 INR — Indian Rupee" },
  { value: "BDT", label: "🇧🇩 BDT — Bangladeshi Taka" },
];

export function LiveCurrencyConverter({ defaultAmount = 10000 }: { defaultAmount?: number }) {
  const [amount, setAmount] = useState(defaultAmount);
  const [from, setFrom] = useState("BDT");
  const [to, setTo] = useState("USD");
  const [data, setData] = useState<RatesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/currency")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("rates unavailable"))))
      .then((json: RatesResponse) => {
        if (active) setData(json);
      })
      .catch(() => {
        /* component still renders with the static fallback below */
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const converted = useMemo(() => {
    if (!data || !data.rates[to]) return null;
    const rate = from === "BDT" ? data.rates[to] : 1 / (data.rates[from] || 1);
    if (from !== "BDT" && to !== "BDT") {
      // cross via BDT base
      const toRate = data.rates[to];
      const fromRate = data.rates[from];
      if (!toRate || !fromRate) return null;
      return (amount / fromRate) * toRate;
    }
    return amount * rate;
  }, [amount, from, to, data]);

  const lastUpdatedLabel = data
    ? new Date(data.lastUpdated).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
    : "";

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">💱 Live Currency Converter</h3>
        {data && (
          <DataStatusBadge status={data.source === "fallback" ? "ESTIMATED" : "LIVE"} />
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 items-end">
        <Input
          label="Amount"
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
        />
        <Select
          label="From"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          options={currencyOptions}
        />
        <Select
          label="To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          options={currencyOptions}
        />
      </div>

      <div className="mt-4 text-center bg-gray-50 rounded-lg p-4">
        {isLoading ? (
          <p className="text-sm text-gray-400">Loading live rates…</p>
        ) : converted !== null ? (
          <>
            <p className="text-2xl font-bold text-bangladesh-green">
              {converted.toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
              <span className="text-base text-gray-500">{to}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              1 {from} ≈{" "}
              {(converted / (amount || 1)).toLocaleString("en-US", { maximumFractionDigits: 4 })} {to}
              {data && ` • Updated ${lastUpdatedLabel}`}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-400">
            Rates unavailable offline — using ESTIMATED static rates.
          </p>
        )}
      </div>
    </Card>
  );
}
