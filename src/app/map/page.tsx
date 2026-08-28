"use client";

import { useState, useEffect } from "react";
import { Card, Badge, DataStatusBadge } from "@/components/ui/Card";
import { districtCoordinates, getMapPoints } from "@/lib/services/transport";
import type { MapPoint } from "@/lib/services/transport";

const pointTypes = [
  { id: "all", label: "All", icon: "📍" },
  { id: "attraction", label: "Attractions", icon: "🏛️" },
  { id: "hotel", label: "Hotels", icon: "🏨" },
  { id: "restaurant", label: "Restaurants", icon: "🍽️" },
  { id: "hospital", label: "Hospitals", icon: "🏥" },
  { id: "police", label: "Police", icon: "👮" },
  { id: "airport", label: "Airports", icon: "✈️" },
  { id: "station", label: "Stations", icon: "🚉" },
];

const typeColors: Record<string, string> = {
  attraction: "bg-blue-500",
  hotel: "bg-purple-500",
  restaurant: "bg-orange-500",
  hospital: "bg-red-500",
  police: "bg-indigo-500",
  airport: "bg-green-500",
  station: "bg-yellow-500",
  atm: "bg-teal-500",
};

export default function MapPage() {
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    setPoints(getMapPoints(selectedType === "all" ? undefined : selectedType));
  }, [selectedType]);

  useEffect(() => {
    if (selectedDistrict && districtCoordinates[selectedDistrict]) {
      const coords = districtCoordinates[selectedDistrict];
      setUserLocation(coords);
    }
  }, [selectedDistrict]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Fallback to Dhaka
          setUserLocation({ lat: 23.8103, lng: 90.4125 });
        }
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interactive Map</h1>
          <p className="text-gray-500 mt-1">Explore Bangladesh&apos;s points of interest</p>
        </div>
        <DataStatusBadge status="ESTIMATED" />
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* District Selector */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">📍 Go to District</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              <button
                onClick={() => setSelectedDistrict(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedDistrict ? "bg-bangladesh-green/10 text-bangladesh-green" : "hover:bg-gray-100"
                }`}
              >
                All Bangladesh
              </button>
              {Object.keys(districtCoordinates).map((district) => (
                <button
                  key={district}
                  onClick={() => setSelectedDistrict(district)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                    selectedDistrict === district ? "bg-bangladesh-green/10 text-bangladesh-green" : "hover:bg-gray-100"
                  }`}
                >
                  {district}
                </button>
              ))}
            </div>
          </Card>

          {/* Point Type Filter */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">🔍 Filter</h3>
            <div className="flex flex-wrap gap-1.5">
              {pointTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedType === type.id
                      ? "bg-bangladesh-green text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Points List */}
          <Card className="max-h-64 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-3">📋 Points ({points.length})</h3>
            <div className="space-y-2">
              {points.map((point) => (
                <div key={point.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                  <div className={`w-3 h-3 rounded-full ${typeColors[point.type] || "bg-gray-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{point.name}</div>
                    <div className="text-xs text-gray-400">{point.district}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Locate Me */}
          <button
            onClick={handleLocateMe}
            className="w-full p-3 bg-bangladesh-green text-white rounded-lg font-medium hover:bg-bangladesh-green/90 transition-colors"
          >
            📍 Locate Me
          </button>
        </div>

        {/* Map Area */}
        <div className="md:col-span-3">
          <Card className="h-[600px] p-0 overflow-hidden relative">
            {/* Static Map Visualization */}
            <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 relative">
              {/* Bangladesh outline approximation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">
                  {/* Map Grid */}
                  <div className="absolute inset-0 opacity-20">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={`h${i}`} className="absolute w-full h-px bg-green-800" style={{ top: `${(i + 1) * 10}%` }} />
                    ))}
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={`v${i}`} className="absolute h-full w-px bg-green-800" style={{ left: `${(i + 1) * 10}%` }} />
                    ))}
                  </div>

                  {/* Points */}
                  {points.map((point, idx) => {
                    // Simple projection for demo
                    const x = ((point.lng - 88) / (92.5 - 88)) * 100;
                    const y = ((26.5 - point.lat) / (26.5 - 20.5)) * 100;
                    return (
                      <div
                        key={point.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                        style={{ left: `${Math.max(5, Math.min(95, x))}%`, top: `${Math.max(5, Math.min(95, y))}%` }}
                      >
                        <div className={`w-4 h-4 rounded-full ${typeColors[point.type] || "bg-gray-500"} border-2 border-white shadow-md hover:scale-150 transition-transform`} />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-white rounded-lg shadow-lg p-2 text-xs whitespace-nowrap">
                            <div className="font-semibold">{point.name}</div>
                            <div className="text-gray-500 capitalize">{point.type}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* User Location */}
                  {userLocation && (
                    <div
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                      style={{
                        left: `${Math.max(5, Math.min(95, ((userLocation.lng - 88) / (92.5 - 88)) * 100))}%`,
                        top: `${Math.max(5, Math.min(95, ((26.5 - userLocation.lat) / (26.5 - 20.5)) * 100))}%`,
                      }}
                    >
                      <div className="w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg animate-pulse" />
                      <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-30" />
                    </div>
                  )}

                  {/* Map Label */}
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
                    <div className="text-sm font-bold text-gray-800">🇧🇩 Bangladesh</div>
                    <div className="text-xs text-gray-500">
                      {selectedDistrict ? `Viewing: ${selectedDistrict}` : "Overview"}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {points.length} points visible
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Legend</div>
                    <div className="space-y-1">
                      {Object.entries(typeColors).map(([type, color]) => (
                        <div key={type} className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                          <span className="text-xs text-gray-600 capitalize">{type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
