"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, Badge } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { CheckboxGroup } from "@/components/ui/Input";
import { interestOptions, travelStyleOptions } from "@/lib/data/bangladesh";

const featuredDestinations = [
  { name: "Cox's Bazar", desc: "World's longest sea beach", emoji: "🏖️", category: "Beach", cost: "৳2,000/day" },
  { name: "Sundarbans", desc: "Royal Bengal Tiger's home", emoji: "🐅", category: "Wildlife", cost: "৳5,000/day" },
  { name: "Sylhet", desc: "Tea gardens & hills", emoji: "🍵", category: "Nature", cost: "৳2,500/day" },
  { name: "Bandarban", desc: "Adventure in the hills", emoji: "🏔️", category: "Mountain", cost: "৳3,000/day" },
  { name: "Dhaka", desc: "Capital city & culture", emoji: "🏛️", category: "Heritage", cost: "৳3,000/day" },
  { name: "Kuakata", desc: "Sunrise & sunset beach", emoji: "🌅", category: "Beach", cost: "৳1,800/day" },
];

const stats = [
  { value: "64", label: "Districts to Explore" },
  { value: "7", label: "Unique Divisions" },
  { value: "300+", label: "Destinations" },
  { value: "24/7", label: "AI Assistance" },
];

export default function HomePage() {
  const [destination, setDestination] = useState("");
  const [showPlanner, setShowPlanner] = useState(false);
  const [days, setDays] = useState(5);
  const [budget, setBudget] = useState(15000);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [travelStyle, setTravelStyle] = useState("solo");

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-hero min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-bangladesh-gold rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-20 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-6">
              <Badge variant="warning" className="mb-2">
                🇧🇩 AI-Powered Travel Guide
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Where do you want to{" "}
                <span className="text-bangladesh-gold">explore Bangladesh?</span>
              </h1>
              <p className="text-lg text-green-100 max-w-lg">
                Your intelligent travel companion. AI trip planning, real-time transport, 
                budget optimization, and 24/7 assistance — all in one place.
              </p>
              
              {/* Quick Search */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Where do you want to go? (e.g., Cox's Bazar)"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-white/95 text-gray-800 placeholder:text-gray-500"
                  />
                </div>
                <Link href={destination ? `/destinations?q=${encodeURIComponent(destination)}` : "/destinations"}>
                  <Button variant="secondary" size="lg">
                    Explore →
                  </Button>
                </Link>
              </div>

              {/* Quick Links */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-green-200 text-sm">Popular:</span>
                {["Cox's Bazar", "Sylhet", "Sundarbans", "Dhaka"].map((dest) => (
                  <Link
                    key={dest}
                    href={`/destinations?q=${encodeURIComponent(dest)}`}
                    className="text-sm text-white/90 hover:text-bangladesh-gold transition-colors"
                  >
                    {dest}
                  </Link>
                ))}
              </div>
            </div>

            {/* Hero Card */}
            <div className="hidden md:block">
              <Card className="bg-white/95 backdrop-blur-sm p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">✨ AI Trip Planner</h3>
                  <Badge variant="success">NEW</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Tell us your preferences and budget — we&apos;ll create your perfect Bangladesh itinerary.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trip Duration</label>
                    <div className="flex items-center gap-3 mt-1">
                      <input
                        type="range"
                        min="1"
                        max="14"
                        value={days}
                        onChange={(e) => setDays(parseInt(e.target.value))}
                        className="flex-1 accent-bangladesh-green"
                      />
                      <span className="text-lg font-bold text-bangladesh-green">{days} days</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Budget (BDT)</label>
                    <div className="flex items-center gap-3 mt-1">
                      <input
                        type="range"
                        min="5000"
                        max="100000"
                        step="1000"
                        value={budget}
                        onChange={(e) => setBudget(parseInt(e.target.value))}
                        className="flex-1 accent-bangladesh-green"
                      />
                      <span className="text-lg font-bold text-bangladesh-green">৳{budget.toLocaleString()}</span>
                    </div>
                  </div>

                  <CheckboxGroup
                    label="Interests"
                    options={interestOptions.slice(0, 6)}
                    selected={selectedInterests}
                    onChange={setSelectedInterests}
                  />

                  <Link href={`/plan?days=${days}&budget=${budget}&interests=${selectedInterests.join(",")}`}>
                    <Button className="w-full" size="lg">
                      🚀 Generate My Trip Plan
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-bangladesh-green">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Explore Bangladesh</h2>
            <p className="text-gray-500 mt-1">Discover the beauty of the Bengal delta</p>
          </div>
          <Link href="/destinations">
            <Button variant="outline">View All →</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredDestinations.map((dest) => (
            <Link key={dest.name} href={`/destinations?q=${encodeURIComponent(dest.name)}`}>
              <Card hover className="group overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-bangladesh-green/10 to-bangladesh-green/5 rounded-lg flex items-center justify-center text-5xl mb-4">
                  {dest.emoji}
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-bangladesh-green transition-colors">
                      {dest.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{dest.desc}</p>
                  </div>
                  <Badge variant="brand">{dest.category}</Badge>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Est. cost</span>
                  <span className="font-medium text-bangladesh-green">{dest.cost}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Everything You Need</h2>
            <p className="text-gray-500 mt-2">Complete travel ecosystem for Bangladesh</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🤖", title: "AI Trip Planner", desc: "Smart itinerary generation based on your preferences and budget" },
              { icon: "🚌", title: "Transport", desc: "Compare buses, trains, flights with real-time fares" },
              { icon: "💰", title: "Budget Optimizer", desc: "Track expenses and optimize your travel budget" },
              { icon: "🗺️", title: "Interactive Map", desc: "Discover attractions, hotels, and services nearby" },
              { icon: "🍛", title: "Food Discovery", desc: "Local cuisine recommendations and food guides" },
              { icon: "🆘", title: "Safety Center", desc: "Emergency contacts, hospitals, and safety tips" },
              { icon: "🗣️", title: "Translation", desc: "Bangla-English translation and common phrases" },
              { icon: "🏨", title: "Hotels", desc: "Smart hotel recommendations by location and budget" },
            ].map((feature) => (
              <Card key={feature.title} hover className="text-center">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-hero py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Explore Bangladesh?
          </h2>
          <p className="text-green-100 mb-8 max-w-2xl mx-auto">
            Start planning your perfect trip with AI assistance. From Cox&apos;s Bazar beaches
            to Sundarbans mangroves — we&apos;ve got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/plan">
              <Button variant="secondary" size="lg">
                🚀 Start Planning
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bangladesh-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🇧🇩</span>
                <span className="font-bold">Bangladesh Guide</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered smart tourist guide system for Bangladesh. Your complete travel companion.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Explore</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/destinations" className="hover:text-white transition-colors">Destinations</Link></li>
                <li><Link href="/transport" className="hover:text-white transition-colors">Transport</Link></li>
                <li><Link href="/map" className="hover:text-white transition-colors">Map</Link></li>
                <li><Link href="/budget" className="hover:text-white transition-colors">Budget Planner</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Tools</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/plan" className="hover:text-white transition-colors">AI Trip Planner</Link></li>
                <li><Link href="/emergency" className="hover:text-white transition-colors">Emergency Center</Link></li>
                <li><Link href="/smart" className="hover:text-white transition-colors">ML & IoT Dashboard</Link></li>
                <li><Link href="/admin" className="hover:text-white transition-colors">Admin</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Information</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/safety" className="hover:text-white transition-colors">Safety Tips</Link></li>
                <li><Link href="/culture" className="hover:text-white transition-colors">Culture Guide</Link></li>
                <li><Link href="/admin" className="hover:text-white transition-colors">Admin</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>© 2026 Bangladesh Tourist Guide. AI-Powered Travel Companion.</p>
            <p className="mt-1 text-xs">
              ⚠️ Data status: ESTIMATED/LIVE — Verify critical information locally before travel.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
