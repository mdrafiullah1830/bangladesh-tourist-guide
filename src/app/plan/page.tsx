"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, Badge, DataStatusBadge } from "@/components/ui/Card";
import { Input, Select, CheckboxGroup } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { interestOptions, travelStyleOptions } from "@/lib/data/bangladesh";
import { formatCurrency } from "@/lib/utils";

type Step = "basics" | "preferences" | "budget" | "result";

interface PlanData {
  days: number;
  travellers: number;
  arrivalDate: string;
  departureDate: string;
  interests: string[];
  travelStyle: string;
  budget: number;
  currency: string;
  arrivalAirport: string;
}

const airportOptions = [
  { value: "DAC", label: "Hazrat Shahjalal Int'l (Dhaka)" },
  { value: "CGP", label: "Shah Amanat Int'l (Chattogram)" },
  { value: "ZYL", label: "Osmani Int'l (Sylhet)" },
  { value: "CXB", label: "Cox's Bazar Airport" },
];

export default function PlanTripPage() {
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>("basics");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [plan, setPlan] = useState<{
    days: { dayNumber: number; date?: string; location?: string; activities: { title: string; type: string; time: string; startTime?: string; cost: number; location?: string; latitude?: number; longitude?: number; sourceUrl?: string }[] }[];
    totalCost: number;
    perPersonCost: number;
    transportOptions: { mode: string; from: string; to: string; duration: string; fare: number; recommendation: string }[];
    recommendations: { id: string; name: string; type: string; sourceUrl: string; qualityScore: number }[];
    sourceCount: number;
    baseCity: string;
    startDate?: string;
    endDate?: string;
    dataStatus: "LAST_UPDATED";
  } | null>(null);

  const [data, setData] = useState<PlanData>({
    days: 5,
    travellers: 1,
    arrivalDate: "",
    departureDate: "",
    interests: [],
    travelStyle: "solo",
    budget: 15000,
    currency: "BDT",
    arrivalAirport: "DAC",
  });

  const [errors, setErrors] = useState<{ days?: string; budget?: string; travellers?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!data.days || data.days < 1) newErrors.days = "At least 1 day required";
    if (!data.days || data.days > 30) newErrors.days = "Maximum 30 days allowed";
    if (!data.budget || data.budget < 1000) newErrors.budget = "Minimum budget ৳1,000";
    if (!data.travellers || data.travellers < 1) newErrors.travellers = "At least 1 traveller";
    if (!data.travellers || data.travellers > 10) newErrors.travellers = "Maximum 10 travellers";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generatePlan = async () => {
    if (!validate()) return;
    setIsGenerating(true);
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Plan generation failed");
      setPlan(result);
      setIsGenerating(false);
      setStep("result");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to generate trip plan", "error");
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {(["basics", "preferences", "budget", "result"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === s ? "bg-bangladesh-green text-white" :
              (["basics", "preferences", "budget", "result"].indexOf(step) > i) ? "bg-bangladesh-green/20 text-bangladesh-green" :
              "bg-gray-200 text-gray-500"
            }`}>
              {["basics", "preferences", "budget", "result"].indexOf(step) > i ? "✓" : i + 1}
            </div>
            {i < 3 && <div className="w-8 md:w-16 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Basics */}
      {step === "basics" && (
        <Card className="animate-fade-in">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Trip Basics</h2>
          <p className="text-gray-500 text-sm mb-6">Let&apos;s start with the fundamentals of your trip</p>
          
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Number of Days"
                type="number"
                min={1}
                max={30}
                value={data.days}
                onChange={(e) => setData({ ...data, days: parseInt(e.target.value) || 1 })}
                error={errors.days}
              />
              <Input
                label="Number of Travellers"
                type="number"
                min={1}
                max={10}
                value={data.travellers}
                onChange={(e) => setData({ ...data, travellers: parseInt(e.target.value) || 1 })}
                error={errors.travellers}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Arrival Date"
                type="date"
                value={data.arrivalDate}
                onChange={(e) => setData({ ...data, arrivalDate: e.target.value })}
              />
              <Input
                label="Departure Date"
                type="date"
                value={data.departureDate}
                onChange={(e) => setData({ ...data, departureDate: e.target.value })}
              />
            </div>
            <Select
              label="Arrival Airport"
              options={airportOptions}
              value={data.arrivalAirport}
              onChange={(e) => setData({ ...data, arrivalAirport: e.target.value })}
            />
            <Button onClick={() => setStep("preferences")} className="w-full" size="lg">
              Continue →
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Preferences */}
      {step === "preferences" && (
        <Card className="animate-fade-in">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your Preferences</h2>
          <p className="text-gray-500 text-sm mb-6">Help us understand what you enjoy</p>
          
          <div className="space-y-5">
            <CheckboxGroup
              label="What are your interests? (Select all that apply)"
              options={interestOptions}
              selected={data.interests}
              onChange={(interests) => setData({ ...data, interests })}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Travel Style</label>
              <div className="grid grid-cols-2 gap-3">
                {travelStyleOptions.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setData({ ...data, travelStyle: style.id })}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      data.travelStyle === style.id
                        ? "border-bangladesh-green bg-bangladesh-green/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium text-sm">{style.label}</div>
                    <div className="text-xs text-gray-500">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("basics")} className="flex-1">
                ← Back
              </Button>
              <Button onClick={() => setStep("budget")} className="flex-1" size="lg">
                Continue →
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Budget */}
      {step === "budget" && (
        <Card className="animate-fade-in">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Budget Planning</h2>
          <p className="text-gray-500 text-sm mb-6">Set your total trip budget</p>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Budget</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5000"
                  max="200000"
                  step="1000"
                  value={data.budget}
                  onChange={(e) => setData({ ...data, budget: parseInt(e.target.value) })}
                  className="flex-1 accent-bangladesh-green"
                />
                <div className="text-right">
                  <span className="text-2xl font-bold text-bangladesh-green">
                    ৳{data.budget.toLocaleString()}
                  </span>
                  <p className="text-xs text-gray-500">
                    ~৳{data.days > 0 ? Math.round(data.budget / data.days).toLocaleString() : 0}/day
                  </p>
                </div>
              </div>
              {errors.budget && <p className="text-xs text-red-500 mt-1">{errors.budget}</p>}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Budget Breakdown (Estimated)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transport</span>
                  <span>{formatCurrency(data.budget * 0.25)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Accommodation</span>
                  <span>{formatCurrency(data.budget * 0.30)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Food & Dining</span>
                  <span>{formatCurrency(data.budget * 0.25)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Activities</span>
                  <span>{formatCurrency(data.budget * 0.15)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-500">Miscellaneous</span>
                  <span>{formatCurrency(data.budget * 0.05)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("preferences")} className="flex-1">
                ← Back
              </Button>
              <Button onClick={generatePlan} className="flex-1" size="lg" isLoading={isGenerating}>
                ✨ Generate Plan
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Result */}
      {step === "result" && plan && (
        <div className="space-y-6 animate-fade-in">
          <Card className="bg-gradient-to-br from-bangladesh-green to-bangladesh-green/90 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Your {data.days}-Day Bangladesh Trip</h2>
                <p className="text-green-100 text-sm">Public-data itinerary around {plan.baseCity}</p>
              </div>
              <DataStatusBadge status={plan.dataStatus} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold">{formatCurrency(plan.totalCost)}</div>
                <div className="text-green-200 text-xs">Total Est. Cost</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{data.days}</div>
                <div className="text-green-200 text-xs">Days</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{data.travellers}</div>
                <div className="text-green-200 text-xs">Travellers · {formatCurrency(plan.perPersonCost)} each</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900">🏨 Suggested stays</h3>
                <p className="text-xs text-gray-500 mt-1">Selected from {plan.sourceCount} nearby public-data matches</p>
              </div>
              <DataStatusBadge status="LAST_UPDATED" />
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              {plan.recommendations.map((place) => (
                <a key={place.id} href={place.sourceUrl} target="_blank" rel="noreferrer" className="rounded-lg border p-3 hover:border-bangladesh-green">
                  <div className="font-medium text-sm">{place.name}</div>
                  <div className="text-xs text-gray-500 mt-1">Source completeness: {Math.round(place.qualityScore * 100)}%</div>
                </a>
              ))}
            </div>
          </Card>

          {/* Day-by-day */}
          {plan.days.map((day) => (
            <Card key={day.dayNumber}>
              <h3 className="font-bold text-gray-900 mb-3">Day {day.dayNumber}{day.date ? ` · ${day.date}` : ""}</h3>
              <div className="space-y-2">
                {day.activities.map((act, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-12 text-xs text-gray-500 font-medium">{act.time}</div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{act.title}</div>
                      {act.location && <div className="text-xs text-gray-500">{act.location}</div>}
                      <Badge variant="default" size="sm">{act.type}</Badge>
                    </div>
                    <div className="text-sm text-gray-500">~{formatCurrency(act.cost)}</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {/* Transport */}
          <Card>
            <h3 className="font-bold text-gray-900 mb-3">🚌 Transport Options</h3>
            <div className="space-y-3">
              {plan.transportOptions.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {t.mode === "bus" ? "🚌" : t.mode === "train" ? "🚂" : "✈️"}
                    </span>
                    <div>
                      <div className="font-medium text-sm">{t.from} → {t.to}</div>
                      <div className="text-xs text-gray-500">{t.duration}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-bangladesh-green">{formatCurrency(t.fare)}</div>
                    <Badge variant={t.recommendation === "recommended" ? "success" : "default"} size="sm">
                      {t.recommendation}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("budget")} className="flex-1">
              ← Modify
            </Button>
            <Button className="flex-1" size="lg" disabled={isSaving} isLoading={isSaving} onClick={async () => {
              if (!plan) return;
              setIsSaving(true);
              try {
                const response = await fetch("/api/trips", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: `${data.days}-Day Bangladesh Trip`,
                    description: `AI-generated ${data.days}-day trip for ${data.travellers} traveller(s)`,
                    totalBudget: data.budget,
                    travellers: data.travellers,
                    interests: data.interests,
                    travelStyle: data.travelStyle,
                    startDate: plan.startDate,
                    endDate: plan.endDate,
                    days: plan.days.map((day: { dayNumber: number; date?: string; location?: string; activities: { title: string; type: string; cost?: number; time?: string }[] }) => ({
                      dayNumber: day.dayNumber,
                      date: day.date,
                      location: day.location,
                      activities: day.activities,
                    })),
                  }),
                });
                if (response.ok) {
                  showToast("Trip saved successfully! 🎉", "success");
                } else if (response.status === 401) {
                  showToast("Please sign in to save your trip.", "error");
                } else {
                  showToast("Failed to save trip. Please try again.", "error");
                }
              } catch {
                showToast("Network error. Please try again.", "error");
              } finally {
                setIsSaving(false);
              }
            }}>
              Save Trip
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
