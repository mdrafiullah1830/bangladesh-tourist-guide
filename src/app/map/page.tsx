"use client";

import { useState, useEffect } from "react";
import { Card, DataStatusBadge } from "@/components/ui/Card";
import { districtCoordinates, getMapPoints } from "@/lib/services/transport";
import type { MapPoint } from "@/lib/services/transport";
import dynamic from "next/dynamic";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

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
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.685, 90.3563]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    fetch(`/api/places?type=${encodeURIComponent(selectedType)}&limit=500&minQuality=0.35`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Public places unavailable");
        return response.json() as Promise<{ points: MapPoint[]; total: number }>;
      })
      .then((result) => {
        setPoints(result.points);
        setTotalPoints(result.total);
        setUsingFallback(false);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const fallback = getMapPoints(selectedType === "all" ? undefined : selectedType);
        setPoints(fallback);
        setTotalPoints(fallback.length);
        setUsingFallback(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [selectedType]);

  useEffect(() => {
    if (selectedDistrict && districtCoordinates[selectedDistrict]) {
      const coords = districtCoordinates[selectedDistrict];
      setMapCenter([coords.lat, coords.lng]);
    } else {
      setMapCenter([23.685, 90.3563]);
    }
  }, [selectedDistrict]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          setUserLocation({ lat: 23.8103, lng: 90.4125 });
          setMapCenter([23.8103, 90.4125]);
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
        <DataStatusBadge status={usingFallback ? "ESTIMATED" : "LAST_UPDATED"} />
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="space-y-4">
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
                    selectedDistrict === district
                      ? "bg-bangladesh-green/10 text-bangladesh-green"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {district}
                </button>
              ))}
            </div>
          </Card>

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

          <button
            onClick={handleLocateMe}
            className="w-full p-3 bg-bangladesh-green text-white rounded-lg font-medium hover:bg-bangladesh-green/90 transition-colors"
          >
            📍 Locate Me
          </button>

          <Card className="text-sm text-gray-600">
            <p>
              {isLoading
                ? "Loading public data…"
                : <><strong>{points.length}</strong> shown from <strong>{totalPoints.toLocaleString()}</strong> matches</>}
            </p>
            {selectedDistrict && <p className="capitalize">District: {selectedDistrict}</p>}
            {!usingFallback && <p className="mt-1 text-xs">Source: © OpenStreetMap contributors</p>}
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card className="h-[600px] p-0 overflow-hidden relative">
            <MapContainer
              center={mapCenter}
              zoom={7}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {points.map((point) => (
                <Marker key={point.id} position={[point.lat, point.lng]}>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">{point.name}</div>
                      <div className="text-gray-500 capitalize">{point.type}</div>
                      {point.description && <div className="text-gray-600 mt-1">{point.description}</div>}
                    </div>
                  </Popup>
                </Marker>
              ))}
              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup>
                    <div className="text-sm font-semibold">Your Location</div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}
