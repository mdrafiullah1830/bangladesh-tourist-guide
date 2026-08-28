"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, Badge, DataStatusBadge } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";

const destinations = [
  { value: "dhaka", label: "Dhaka" },
  { value: "chattogram", label: "Chattogram" },
  { value: "cox's bazar", label: "Cox's Bazar" },
  { value: "sylhet", label: "Sylhet" },
  { value: "khulna", label: "Khulna" },
  { value: "rajshahi", label: "Rajshahi" },
  { value: "barishal", label: "Barishal" },
  { value: "rangpur", label: "Rangpur" },
];

const transportModes = [
  { id: "all", label: "All Modes", icon: "🌐" },
  { id: "bus", label: "Bus", icon: "🚌" },
  { id: "train", label: "Train", icon: "🚂" },
  { id: "flight", label: "Flight", icon: "✈️" },
  { id: "launch", label: "Launch", icon: "🚢" },
];

const mockRoutes = [
  {
    id: "1", mode: "bus", operator: "Green Line Paribahan", from: "Dhaka", to: "Chattogram",
    fromPoint: "Sayedabad", toPoint: "Dampara", duration: "5-6 hours", durationMin: 330,
    distance: 250, fare: { min: 900, max: 1500 }, comfort: "premium", schedule: "Every 2 hours",
  },
  {
    id: "2", mode: "bus", operator: "Shohag Paribahan", from: "Dhaka", to: "Chattogram",
    fromPoint: "Sayedabad", toPoint: "Dampara", duration: "5-7 hours", durationMin: 360,
    distance: 250, fare: { min: 600, max: 900 }, comfort: "standard", schedule: "Every 1 hour",
  },
  {
    id: "3", mode: "train", operator: "Subarna Express", from: "Dhaka", to: "Chattogram",
    fromPoint: "Kamalapur", toPoint: "CTG Station", duration: "6-7 hours", durationMin: 390,
    distance: 250, fare: { min: 300, max: 1200 }, comfort: "standard", schedule: "Daily 7:00 AM",
  },
  {
    id: "4", mode: "flight", operator: "US-Bangla Airlines", from: "Dhaka", to: "Chattogram",
    fromPoint: "DAC Airport", toPoint: "CGP Airport", duration: "45 mins", durationMin: 45,
    distance: 250, fare: { min: 3500, max: 6000 }, comfort: "premium", schedule: "Multiple daily",
  },
  {
    id: "5", mode: "bus", operator: "S Alam Paribahan", from: "Dhaka", to: "Cox's Bazar",
    fromPoint: "Sayedabad", toPoint: "Cox's Bazar Terminal", duration: "8-10 hours", durationMin: 540,
    distance: 420, fare: { min: 800, max: 1600 }, comfort: "standard", schedule: "Multiple daily",
  },
  {
    id: "6", mode: "flight", operator: "US-Bangla Airlines", from: "Dhaka", to: "Cox's Bazar",
    fromPoint: "DAC Airport", toPoint: "CXB Airport", duration: "55 mins", durationMin: 55,
    distance: 300, fare: { min: 4000, max: 7000 }, comfort: "premium", schedule: "Daily",
  },
  {
    id: "7", mode: "bus", operator: "Ena Transport", from: "Dhaka", to: "Sylhet",
    fromPoint: "Mohakhali", toPoint: "Sylhet Terminal", duration: "5-6 hours", durationMin: 330,
    distance: 240, fare: { min: 500, max: 900 }, comfort: "standard", schedule: "Every 30 mins",
  },
  {
    id: "8", mode: "train", operator: "Parabat Express", from: "Dhaka", to: "Sylhet",
    fromPoint: "Kamalapur", toPoint: "Sylhet Station", duration: "6-7 hours", durationMin: 390,
    distance: 260, fare: { min: 250, max: 1000 }, comfort: "standard", schedule: "Daily 7:00 AM",
  },
];

export default function TransportPage() {
  const [fromDest, setFromDest] = useState("dhaka");
  const [toDest, setToDest] = useState("chattogram");
  const [mode, setMode] = useState("all");
  const [sortBy, setSortBy] = useState<"cheapest" | "fastest" | "recommended">("recommended");

  const filtered = mockRoutes.filter((r) => {
    const matchFrom = r.from.toLowerCase() === fromDest || r.from.toLowerCase().includes(fromDest);
    const matchTo = r.to.toLowerCase() === toDest || r.to.toLowerCase().includes(toDest);
    const matchMode = mode === "all" || r.mode === mode;
    return matchFrom && matchTo && matchMode;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "cheapest") return (a.fare.min || 0) - (b.fare.min || 0);
    if (sortBy === "fastest") return (a.durationMin || 0) - (b.durationMin || 0);
    // Recommended: balance score
    const scoreA = (1000 / (a.fare.min || 1000)) * 50 + (500 / (a.durationMin || 300)) * 30;
    const scoreB = (1000 / (b.fare.min || 1000)) * 50 + (500 / (b.durationMin || 300)) * 30;
    return scoreB - scoreA;
  });

  const swapDestinations = () => {
    setFromDest(toDest);
    setToDest(fromDest);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Transport Planner</h1>
        <p className="text-gray-500 mt-1">Compare buses, trains, and flights across Bangladesh</p>
      </div>

      {/* Search Form */}
      <Card className="mb-6">
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Select
                label="From"
                options={destinations}
                value={fromDest}
                onChange={(e) => setFromDest(e.target.value)}
              />
            </div>
            <button
              onClick={swapDestinations}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors mb-0.5"
            >
              ⇄
            </button>
            <div className="flex-1">
              <Select
                label="To"
                options={destinations}
                value={toDest}
                onChange={(e) => setToDest(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              {transportModes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    mode === m.id
                      ? "bg-bangladesh-green text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
            <Select
              options={[
                { value: "recommended", label: "🏆 Recommended" },
                { value: "cheapest", label: "💰 Cheapest" },
                { value: "fastest", label: "⚡ Fastest" },
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-44"
            />
          </div>
        </div>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {sorted.length} route{sorted.length !== 1 ? "s" : ""} found
        </p>
        <DataStatusBadge status="ESTIMATED" />
      </div>

      <div className="space-y-4">
        {sorted.length === 0 ? (
          <Card className="text-center py-8">
            <div className="text-3xl mb-3">🚫</div>
            <h3 className="font-semibold text-gray-800">No routes found</h3>
            <p className="text-sm text-gray-500 mt-1">Try different destinations or transport mode</p>
          </Card>
        ) : (
          sorted.map((route, idx) => (
            <Card key={route.id} hover>
              <div className="flex items-center gap-4">
                <div className="text-3xl">
                  {route.mode === "bus" ? "🚌" : route.mode === "train" ? "🚂" : route.mode === "flight" ? "✈️" : "🚢"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{route.operator}</h3>
                    {idx === 0 && sortBy === "recommended" && (
                      <Badge variant="success">🏆 Recommended</Badge>
                    )}
                    {idx === 0 && sortBy === "cheapest" && (
                      <Badge variant="success">💰 Cheapest</Badge>
                    )}
                    {idx === 0 && sortBy === "fastest" && (
                      <Badge variant="success">⚡ Fastest</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {route.fromPoint} → {route.toPoint}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>⏱️ {route.duration}</span>
                    <span>📏 {route.distance} km</span>
                    <span>🕐 {route.schedule}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-bangladesh-green">
                    {formatCurrency(route.fare.min || 0)}
                  </div>
                  {route.fare.max && route.fare.max !== route.fare.min && (
                    <div className="text-xs text-gray-400">
                      to {formatCurrency(route.fare.max)}
                    </div>
                  )}
                  <Badge
                    variant={route.comfort === "premium" ? "brand" : "default"}
                    size="sm"
                  >
                    {route.comfort}
                  </Badge>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Info */}
      <Card className="mt-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-gray-900">Important Notice</h3>
            <p className="text-sm text-gray-600 mt-1">
              All fares and schedules are estimated. Verify current prices and availability 
              directly with operators or through booking platforms like 12Go.asia.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
