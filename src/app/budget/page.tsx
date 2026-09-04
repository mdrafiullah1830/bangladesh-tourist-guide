"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, Badge, DataStatusBadge } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { convertCurrency } from "@/lib/services/budget";

const budgetTiers = [
  { id: "budget", label: "Budget Traveler", desc: "Hostels, street food, public transport", dailyRange: "৳1,500-2,500", color: "bg-green-100 text-green-700" },
  { id: "mid", label: "Mid-Range", desc: "3★ hotels, restaurants, AC transport", dailyRange: "৳3,000-5,000", color: "bg-blue-100 text-blue-700" },
  { id: "premium", label: "Premium", desc: "5★ hotels, private tours, flights", dailyRange: "৳6,000-10,000", color: "bg-purple-100 text-purple-700" },
];

const expenseCategories = [
  { id: "transport", label: "Transport", icon: "🚌", defaultPct: 25 },
  { id: "accommodation", label: "Accommodation", icon: "🏨", defaultPct: 30 },
  { id: "food", label: "Food & Dining", icon: "🍛", defaultPct: 25 },
  { id: "activities", label: "Activities", icon: "🎯", defaultPct: 15 },
  { id: "other", label: "Miscellaneous", icon: "📦", defaultPct: 5 },
];

interface Expense {
  id: string;
  category: string;
  amount: number;
  note: string;
  date: string;
}

export default function BudgetPage() {
  const [totalBudget, setTotalBudget] = useState(20000);
  const [currency, setCurrency] = useState("BDT");
  const [days, setDays] = useState(5);
  const [travellers, setTravellers] = useState(1);
  const [selectedTier, setSelectedTier] = useState("mid");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState({ category: "food", amount: 0, note: "" });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch expenses from API
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/budget");
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses.map((e: any) => ({ ...e, note: e.notes || "" })));
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const dailyBudget = days > 0 ? totalBudget / days : 0;
  const perPersonBudget = travellers > 0 ? totalBudget / travellers : 0;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = totalBudget - totalExpenses;

  const addExpense = async () => {
    if (newExpense.amount <= 0) return;
    try {
      const response = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: expenseCategories.find(c => c.id === newExpense.category)?.label || "Expense",
          amount: newExpense.amount,
          category: newExpense.category,
          notes: newExpense.note,
        }),
      });
      if (response.ok) {
        await fetchExpenses();
        setNewExpense({ category: "food", amount: 0, note: "" });
      }
    } catch (error) {
      console.error("Failed to add expense:", error);
    }
  };

  const removeExpense = async (id: string) => {
    try {
      const response = await fetch(`/api/budget?id=${id}`, { method: "DELETE" });
      if (response.ok) {
        await fetchExpenses();
      }
    } catch (error) {
      console.error("Failed to remove expense:", error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Budget Planner</h1>
        <p className="text-gray-500 mt-1">Plan and track your travel expenses</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Budget Setup */}
        <div className="md:col-span-2 space-y-6">
          {/* Budget Input */}
          <Card>
            <h2 className="font-bold text-gray-900 mb-4">💰 Trip Budget</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Total Budget"
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(parseInt(e.target.value) || 0)}
                />
                <Input
                  label="Days"
                  type="number"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                />
                <Input
                  label="Travellers"
                  type="number"
                  value={travellers}
                  onChange={(e) => setTravellers(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-bangladesh-green">
                    {formatCurrency(dailyBudget)}
                  </div>
                  <div className="text-xs text-gray-500">per day</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-bangladesh-green">
                    {formatCurrency(perPersonBudget)}
                  </div>
                  <div className="text-xs text-gray-500">per person</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(remaining)}
                  </div>
                  <div className="text-xs text-gray-500">remaining</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Budget Tiers */}
          <Card>
            <h2 className="font-bold text-gray-900 mb-4">📊 Budget Tiers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {budgetTiers.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedTier === tier.id
                      ? "border-bangladesh-green bg-bangladesh-green/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Badge className={tier.color}>{tier.label}</Badge>
                  <p className="text-xs text-gray-500 mt-2">{tier.desc}</p>
                  <p className="text-sm font-bold text-gray-900 mt-2">{tier.dailyRange}/day</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Expense Tracker */}
          <Card>
            <h2 className="font-bold text-gray-900 mb-4">📝 Expense Tracker</h2>
            
            {/* Add Expense */}
            <div className="flex gap-2 mb-4">
              <Select
                options={expenseCategories.map((c) => ({ value: c.id, label: `${c.icon} ${c.label}` }))}
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Amount"
                value={newExpense.amount || ""}
                onChange={(e) => setNewExpense({ ...newExpense, amount: parseInt(e.target.value) || 0 })}
                className="w-28"
              />
              <Button onClick={addExpense}>Add</Button>
            </div>

            {/* Expense List */}
            {isLoading ? (
              <div className="text-center py-6 text-gray-400">
                <div className="text-2xl mb-2">⏳</div>
                <p className="text-sm">Loading expenses...</p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <div className="text-2xl mb-2">📋</div>
                <p className="text-sm">No expenses added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span>{expenseCategories.find((c) => c.id === exp.category)?.icon}</span>
                      <span className="text-sm font-medium">
                        {expenseCategories.find((c) => c.id === exp.category)?.label}
                      </span>
                      {exp.note && <span className="text-xs text-gray-400">({exp.note})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{formatCurrency(exp.amount)}</span>
                      <button
                        onClick={() => removeExpense(exp.id)}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Summary */}
        <div className="space-y-6">
          {/* Budget Health */}
          <Card className="bg-gradient-to-br from-bangladesh-green to-bangladesh-green/90 text-white">
            <h3 className="font-semibold mb-3">Budget Health</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-100">Spent</span>
                  <span>{totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${totalBudget > 0 ? Math.min((totalExpenses / totalBudget) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <div className="text-xl font-bold">{formatCurrency(totalExpenses)}</div>
                  <div className="text-xs text-green-200">Total Spent</div>
                </div>
                <div>
                  <div className={`text-xl font-bold ${remaining < 0 ? "text-red-300" : ""}`}>
                    {formatCurrency(remaining)}
                  </div>
                  <div className="text-xs text-green-200">Remaining</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Currency Converter */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">💱 Currency Converter</h3>
            <div className="space-y-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-bangladesh-green">
                  {formatCurrency(totalBudget)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ≈ ${convertCurrency(totalBudget, "BDT", "USD").toLocaleString()} USD
                </div>
                <div className="text-xs text-gray-500">
                  ≈ €{convertCurrency(totalBudget, "BDT", "EUR").toLocaleString()} EUR
                </div>
              </div>
              <DataStatusBadge status="ESTIMATED" />
            </div>
          </Card>

          {/* Tips */}
          <Card className="bg-yellow-50 border-yellow-200">
            <h3 className="font-semibold text-gray-900 mb-2">💡 Money Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Carry cash - many places don&apos;t accept cards</li>
              <li>• ATMs available in cities (limit: ৳20,000/txn)</li>
              <li>• Bargain at local markets</li>
              <li>• Keep small notes for rickshaw/tips</li>
              <li>• Mobile banking (bKash/Nagad) widely accepted</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
