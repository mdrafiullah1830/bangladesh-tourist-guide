"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { interestOptions } from "@/lib/data/bangladesh";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    travelStyle: "",
    interests: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8 || !/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      setError("Password must be at least 8 characters and contain both letters and numbers");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          country: formData.country,
          travelStyle: formData.travelStyle,
          interests: formData.interests,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = "/";
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-4xl">🇧🇩</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Start your Bangladesh adventure</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step >= s ? "bg-bangladesh-green text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {s}
              </div>
              {s < 2 && <div className="flex-1 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
              <Button type="button" onClick={() => setStep(2)} className="w-full" size="lg">
                Continue →
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Select
                label="Country of Origin"
                options={[
                  { value: "", label: "Select your country" },
                  { value: "US", label: "United States" },
                  { value: "UK", label: "United Kingdom" },
                  { value: "CA", label: "Canada" },
                  { value: "AU", label: "Australia" },
                  { value: "IN", label: "India" },
                  { value: "DE", label: "Germany" },
                  { value: "FR", label: "France" },
                  { value: "JP", label: "Japan" },
                  { value: "CN", label: "China" },
                  { value: "other", label: "Other" },
                ]}
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.slice(0, 6).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        const interests = formData.interests.includes(opt.id)
                          ? formData.interests.filter((i) => i !== opt.id)
                          : [...formData.interests, opt.id];
                        setFormData({ ...formData, interests });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${
                        formData.interests.includes(opt.id)
                          ? "border-bangladesh-green bg-bangladesh-green/10 text-bangladesh-green"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  ← Back
                </Button>
                <Button type="submit" className="flex-1" size="lg" isLoading={isLoading}>
                  Create Account
                </Button>
              </div>
            </>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-bangladesh-green font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
