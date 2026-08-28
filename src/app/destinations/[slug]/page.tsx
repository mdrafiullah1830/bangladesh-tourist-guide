"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, Badge, DataStatusBadge } from "@/components/ui/Card";
import { bangladeshDestinations } from "@/lib/data/bangladesh";
import { formatCurrency } from "@/lib/utils";

export default function DestinationDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const destination = bangladeshDestinations.find((d) => d.slug === slug);

  if (!destination) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900">Destination Not Found</h1>
        <p className="text-gray-500 mt-2">The destination you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/destinations">
          <Button className="mt-6">← Back to Destinations</Button>
        </Link>
      </div>
    );
  }

  const relatedDestinations = bangladeshDestinations
    .filter((d) => d.slug !== slug && (d.category === destination.category || d.division === destination.division))
    .slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-bangladesh-green">Home</Link>
        <span>/</span>
        <Link href="/destinations" className="hover:text-bangladesh-green">Destinations</Link>
        <span>/</span>
        <span className="text-gray-900">{destination.name}</span>
      </div>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-bangladesh-green to-bangladesh-green/80 text-white p-8 md:p-12 mb-8">
        <div className="absolute top-4 right-4">
          <DataStatusBadge status="ESTIMATED" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="warning">{destination.division} Division</Badge>
            {destination.isHiddenGem && <Badge variant="error">💎 Hidden Gem</Badge>}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{destination.name}</h1>
          <p className="text-green-100 max-w-2xl">{destination.description}</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <div className="text-xs text-green-200">Best Time</div>
              <div className="font-semibold">{destination.bestTimeToVisit}</div>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <div className="text-xs text-green-200">Est. Cost/Day</div>
              <div className="font-semibold">{formatCurrency(destination.estimatedCost || 0)}</div>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <div className="text-xs text-green-200">Recommended Stay</div>
              <div className="font-semibold">{destination.stayDuration}</div>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <div className="text-xs text-green-200">Safety</div>
              <div className="font-semibold">{"⭐".repeat(Math.round(destination.safetyRating || 3))}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-600 leading-relaxed">{destination.description}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {destination.tags.map((tag) => (
                <Badge key={tag} variant="brand">{tag}</Badge>
              ))}
            </div>
          </Card>

          {/* Attractions */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">🏛️ Top Attractions</h2>
            <div className="space-y-3">
              {getAttractionsForDestination(destination.slug).map((attraction) => (
                <div key={attraction.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <h4 className="font-medium text-gray-900">{attraction.name}</h4>
                    <p className="text-sm text-gray-500">{attraction.desc}</p>
                  </div>
                  <Badge variant="default">{attraction.type}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Local Food */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">🍛 Local Food to Try</h2>
            <div className="grid grid-cols-2 gap-3">
              {getFoodForDestination(destination.slug).map((food) => (
                <div key={food} className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                  <span className="text-sm font-medium text-gray-800">{food}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Transport */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">🚌 Getting There</h2>
            <div className="space-y-3">
              {getTransportForDestination(destination.slug).map((transport, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{transport.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{transport.mode}</div>
                      <div className="text-xs text-gray-500">{transport.desc}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm text-bangladesh-green">{transport.fare}</div>
                    <div className="text-xs text-gray-400">{transport.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-bangladesh-green/5 border-bangladesh-green/20">
            <h3 className="font-semibold text-gray-900 mb-3">Plan Your Visit</h3>
            <div className="space-y-2">
              <Link href={`/plan?destination=${destination.slug}`}>
                <Button className="w-full" size="sm">🗺️ Add to Trip Plan</Button>
              </Link>
              <Link href="/transport">
                <Button variant="outline" className="w-full" size="sm">🚌 Find Transport</Button>
              </Link>
              <Link href="/budget">
                <Button variant="ghost" className="w-full" size="sm">💰 Budget Calculator</Button>
              </Link>
            </div>
          </Card>

          {/* Safety Info */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">🛡️ Safety Info</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Safety Rating: {"⭐".repeat(Math.round(destination.safetyRating || 3))}/5</p>
              <p>• Emergency: Call 999</p>
              <p>• Tourist Police: +880 2 8901555</p>
            </div>
            <Link href="/emergency">
              <Button variant="outline" className="w-full mt-3" size="sm">
                Emergency Center →
              </Button>
            </Link>
          </Card>

          {/* Related */}
          {relatedDestinations.length > 0 && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">🔗 Related Destinations</h3>
              <div className="space-y-2">
                {relatedDestinations.map((dest) => (
                  <Link key={dest.slug} href={`/destinations/${dest.slug}`}>
                    <div className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="font-medium text-sm text-gray-900">{dest.name}</div>
                      <div className="text-xs text-gray-500">{dest.shortDesc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function getAttractionsForDestination(slug: string): { name: string; desc: string; type: string }[] {
  const attractions: Record<string, { name: string; desc: string; type: string }[]> = {
    dhaka: [
      { name: "Lalbagh Fort", desc: "Mughal fort from 1678", type: "Historical" },
      { name: "Ahsan Manzil", desc: "Pink palace of the Nawabs", type: "Historical" },
      { name: "Star Mosque", desc: "Beautiful mosaic-decorated mosque", type: "Religious" },
      { name: "National Parliament House", desc: "Iconic Louis Kahn architecture", type: "Modern" },
    ],
    "coxs-bazar": [
      { name: "Cox's Bazar Beach", desc: "World's longest natural sea beach", type: "Natural" },
      { name: "Inani Beach", desc: "Coral-strewn pristine beach", type: "Natural" },
      { name: "Himchari National Park", desc: "Waterfall and hill forest", type: "Natural" },
      { name: "Ramu Buddhist Temple", desc: "Ancient Buddhist monastery", type: "Religious" },
    ],
    sylhet: [
      { name: "Ratargul Swamp Forest", desc: "Freshwater mangrove forest", type: "Natural" },
      { name: "Tea Gardens", desc: "Rolling green tea estates", type: "Natural" },
      { name: "Shahjalal Dargah", desc: "Sufi shrine", type: "Religious" },
      { name: "Madhabkunda Waterfall", desc: "Scenic waterfall in hills", type: "Natural" },
    ],
  };
  return attractions[slug] || [
    { name: "Local Heritage Sites", desc: "Historical landmarks", type: "Historical" },
    { name: "Natural Attractions", desc: "Scenic natural beauty", type: "Natural" },
    { name: "Cultural Centers", desc: "Local art and culture", type: "Cultural" },
  ];
}

function getFoodForDestination(slug: string): string[] {
  const foods: Record<string, string[]> = {
    dhaka: ["Dhaka Biryani", "Fuchka", "Chotpoti", "Hilsha Fish", "Seven-layer Tea", "Roshogolla"],
    "coxs-bazar": ["Grilled Fish", "Fresh Crab", "Pomfret Fry", "Coconut Water", "Seafood Platter"],
    sylhet: ["Seven-layer Tea", "Pitha (Rice Cakes)", "Duck Curry", "Tangerines", "Fish from Haor"],
  };
  return foods[slug] || ["Local Bengali Thali", "Fresh Fish Curry", "Street Food", "Traditional Sweets"];
}

function getTransportForDestination(slug: string): { mode: string; icon: string; desc: string; fare: string; duration: string }[] {
  const transport: Record<string, { mode: string; icon: string; desc: string; fare: string; duration: string }[]> = {
    dhaka: [
      { mode: "Flight", icon: "✈️", desc: "From any major city", fare: "৳3,500-6,000", duration: "45-60 min" },
      { mode: "Train", icon: "🚂", desc: "From Chattogram/Sylhet", fare: "৳300-1,200", duration: "5-9 hours" },
      { mode: "Bus", icon: "🚌", desc: "From all major cities", fare: "৳500-1,500", duration: "5-10 hours" },
    ],
    "coxs-bazar": [
      { mode: "Flight", icon: "✈️", desc: "From Dhaka", fare: "৳4,000-7,000", duration: "55 min" },
      { mode: "Bus", icon: "🚌", desc: "From Dhaka/Chattogram", fare: "৳800-1,600", duration: "8-10 hours" },
    ],
    sylhet: [
      { mode: "Flight", icon: "✈️", desc: "From Dhaka", fare: "৳3,000-5,000", duration: "45 min" },
      { mode: "Train", icon: "🚂", desc: "From Dhaka", fare: "৳250-1,000", duration: "6-7 hours" },
      { mode: "Bus", icon: "🚌", desc: "From Dhaka", fare: "৳500-900", duration: "5-6 hours" },
    ],
  };
  return transport[slug] || [
    { mode: "Bus", icon: "🚌", desc: "From major cities", fare: "৳500-1,500", duration: "Varies" },
    { mode: "Train", icon: "🚂", desc: "Railway connection", fare: "৳300-1,200", duration: "Varies" },
  ];
}
