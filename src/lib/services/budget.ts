import type { BudgetBreakdown } from "@/lib/types";

// ============ BUDGET ENGINE ============

export interface BudgetInput {
  totalBudget: number;
  currency: string;
  travellers: number;
  days: number;
  travelStyle: "budget" | "mid" | "premium";
  destinations: string[];
}

export interface BudgetPlan {
  totalBudget: number;
  currency: string;
  perPersonTotal: number;
  perPersonDaily: number;
  breakdown: BudgetBreakdown;
  tips: string[];
  dataStatus: "ESTIMATED";
}

// Average costs in BDT
const costBenchmarks = {
  budget: {
    accommodation: { min: 800, max: 1500 },
    food: { min: 500, max: 1000 },
    transport: { min: 300, max: 800 },
    activities: { min: 200, max: 500 },
    other: { min: 200, max: 400 },
  },
  mid: {
    accommodation: { min: 2000, max: 4000 },
    food: { min: 1000, max: 2000 },
    transport: { min: 800, max: 1500 },
    activities: { min: 500, max: 1000 },
    other: { min: 500, max: 1000 },
  },
  premium: {
    accommodation: { min: 5000, max: 15000 },
    food: { min: 2000, max: 4000 },
    transport: { min: 1500, max: 3000 },
    activities: { min: 1000, max: 2000 },
    other: { min: 1000, max: 2000 },
  },
};

export function calculateBudgetPlan(input: BudgetInput): BudgetPlan {
  const { totalBudget, currency, travellers, days, travelStyle } = input;
  const style = travelStyle || "mid";
  const benchmarks = costBenchmarks[style];
  
  const perPersonTotal = totalBudget / travellers;
  const perPersonDaily = perPersonTotal / days;

  // Allocate budget across categories
  const transportCost = Math.min(benchmarks.transport.max * days, perPersonDaily * days * 0.25);
  const accommodationCost = Math.min(benchmarks.accommodation.max * days, perPersonDaily * days * 0.30);
  const foodCost = Math.min(benchmarks.food.max * days, perPersonDaily * days * 0.25);
  const activitiesCost = Math.min(benchmarks.activities.max * days, perPersonDaily * days * 0.15);
  const otherCost = Math.min(benchmarks.other.max * days, perPersonDaily * days * 0.05);

  const breakdown: BudgetBreakdown = {
    transport: Math.round(transportCost),
    accommodation: Math.round(accommodationCost),
    food: Math.round(foodCost),
    activities: Math.round(activitiesCost),
    shopping: 0,
    other: Math.round(otherCost),
    total: Math.round(transportCost + accommodationCost + foodCost + activitiesCost + otherCost),
    currency,
  };

  return {
    totalBudget,
    currency,
    perPersonTotal: Math.round(perPersonTotal),
    perPersonDaily: Math.round(perPersonDaily),
    breakdown,
    tips: generateBudgetTips(style, perPersonDaily, days),
    dataStatus: "ESTIMATED",
  };
}

function generateBudgetTips(style: string, daily: number, days: number): string[] {
  const tips: string[] = [];
  
  if (style === "budget") {
    tips.push("Stay in hostels and budget hotels to save on accommodation");
    tips.push("Eat at local hotels and street food stalls");
    tips.push("Use local buses instead of AC buses for intercity travel");
    tips.push("Travel during off-peak season for lower prices");
  } else if (style === "mid") {
    tips.push("Book 3-star hotels for good value");
    tips.push("Mix street food with restaurant meals");
    tips.push("AC buses offer comfort at reasonable prices");
    tips.push("Book flights in advance for domestic routes");
  } else {
    tips.push("Book premium hotels with cancellation flexibility");
    tips.push("Consider private car rental for comfort");
    tips.push("Domestic flights save time between distant cities");
    tips.push("Guided tours enhance the experience");
  }

  tips.push(`With ৳${Math.round(daily)}/day, you have ${daily > 3000 ? "a comfortable" : daily > 1500 ? "a moderate" : "a tight"} budget`);
  tips.push("Carry cash - many places don't accept cards");
  tips.push("Bargain at local markets but not at established shops");
  
  return tips;
}

export function convertCurrency(amount: number, from: string, to: string): number {
  // Approximate rates - in production, use a real API
  const rates: Record<string, number> = {
    "BDT-USD": 0.0091,
    "BDT-EUR": 0.0084,
    "BDT-GBP": 0.0071,
    "BDT-INR": 0.76,
    "USD-BDT": 110,
    "EUR-BDT": 119,
    "GBP-BDT": 140,
    "INR-BDT": 1.32,
  };

  const key = `${from}-${to}`;
  const rate = rates[key] || 1;
  return Math.round(amount * rate);
}

export function getCurrencyRates(): { from: string; to: string; rate: number }[] {
  return [
    { from: "BDT", to: "USD", rate: 0.0091 },
    { from: "BDT", to: "EUR", rate: 0.0084 },
    { from: "BDT", to: "GBP", rate: 0.0071 },
    { from: "BDT", to: "INR", rate: 0.76 },
    { from: "USD", to: "BDT", rate: 110 },
    { from: "EUR", to: "BDT", rate: 119 },
    { from: "GBP", to: "BDT", rate: 140 },
    { from: "INR", to: "BDT", rate: 1.32 },
  ];
}
