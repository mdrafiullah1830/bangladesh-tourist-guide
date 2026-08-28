"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, Badge, Skeleton } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { bangladeshDestinations } from "@/lib/data/bangladesh";
import { DataStatusBadge } from "@/components/ui/Card";

const categories = [
  { id: "all", label: "All", icon: "🌍" },
  { id: "beach", label: "Beaches", icon: "🏖️" },
  { id: "nature", label: "Nature", icon: "🌿" },
  { id: "heritage", label: "Heritage", icon: "🏛️" },
  { id: "mountain", label: "Mountains", icon: "🏔️" },
  { id: "city", label: "Cities", icon: "🏙️" },
];

function DestinationsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showGems, setShowGems] = useState(false);

  const filtered = bangladeshDestinations.filter((dest) => {
    const matchesQuery = !query || 
      dest.name.toLowerCase().includes(query.toLowerCase()) ||
      dest.description.toLowerCase().includes(query.toLowerCase()) ||
      dest.tags.some(t => t.toLowerCase().includes(query.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || dest.category === selectedCategory;
    const matchesGems = !showGems || dest.isHiddenGem;
    return matchesQuery && matchesCategory && matchesGems;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Explore Bangladesh</h1>
        <p className="text-gray-500 mt-1">Discover {bangladeshDestinations.length}+ destinations across the country</p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 mb-8">
        <Input
          placeholder="Search destinations, activities, or keywords..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<span>🔍</span>}
        />
        
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? "bg-bangladesh-green text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
          <button
            onClick={() => setShowGems(!showGems)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              showGems
                ? "bg-bangladesh-gold text-bangladesh-dark"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            💎 Hidden Gems
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {filtered.length} destination{filtered.length !== 1 ? "s" : ""} found
        </p>
        <DataStatusBadge status="ESTIMATED" />
      </div>

      {/* Destinations Grid */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="font-semibold text-gray-800 mb-2">No destinations found</h3>
          <p className="text-gray-500">Try a different search or filter</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((dest) => (
            <Link key={dest.slug} href={`/destinations/${dest.slug}`}>
              <Card hover className="group h-full">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-bangladesh-green transition-colors">
                      {dest.name}
                    </h3>
                    <p className="text-sm text-gray-500">{dest.division} Division</p>
                  </div>
                  {dest.isHiddenGem && (
                    <Badge variant="warning">💎 Hidden Gem</Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{dest.shortDesc}</p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {dest.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} size="sm">{tag}</Badge>
                  ))}
                </div>
                
                <div className="pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-gray-500">Best Time</div>
                    <div className="text-xs font-medium">{dest.bestTimeToVisit?.split(" ")[0]}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Est. Cost</div>
                    <div className="text-xs font-medium text-bangladesh-green">৳{dest.estimatedCost}/d</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Stay</div>
                    <div className="text-xs font-medium">{dest.stayDuration}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Info */}
      <Card className="mt-8 bg-bangladesh-green/5 border-bangladesh-green/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-semibold text-gray-900">Planning a trip?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Use our AI Trip Planner to generate a complete itinerary based on your preferences, 
              budget, and travel dates.
            </p>
            <Link href="/plan">
              <Button size="sm" className="mt-3">
                Open Trip Planner →
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function DestinationsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8"><Skeleton lines={10} /></div>}>
      <DestinationsContent />
    </Suspense>
  );
}
