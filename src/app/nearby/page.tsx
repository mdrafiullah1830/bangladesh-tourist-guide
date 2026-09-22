"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, Badge, DataStatusBadge } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface NearbyPlace {
  id: string;
  name: string;
  nameBn?: string | null;
  type: string;
  lat: number;
  lng: number;
  address?: string | null;
  phone?: string | null;
  distanceKm: number;
}

interface RouteInfo {
  distanceKm: number;
  durationMin: number;
  steps: { instruction: string; name: string; distance: number }[];
}

const typeOptions = [
  { value: "all", label: "All nearby" },
  { value: "attraction", label: "🏛️ Attractions" },
  { value: "restaurant", label: "🍽️ Restaurants" },
  { value: "hotel", label: "🏨 Hotels" },
  { value: "hospital", label: "🏥 Hospitals" },
  { value: "police", label: "👮 Police" },
  { value: "station", label: "🚉 Stations" },
];

const typeIcons: Record<string, string> = {
  hospital: "🏥",
  clinic: "🏥",
  police: "👮",
  attraction: "🏛️",
  restaurant: "🍽️",
  hotel: "🏨",
  station: "🚉",
  bus_station: "🚉",
  fast_food: "🍽️",
  cafe: "☕",
  fuel: "⛽",
  atm: "🏧",
  pharmacy: "💊",
};

function iconFor(type: string): string {
  return typeIcons[type] || "📍";
}

export default function NearbyPage() {
  const { showToast } = useToast();
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [type, setType] = useState("all");
  const [radius, setRadius] = useState("5");
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [source, setSource] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeTarget, setRouteTarget] = useState<NearbyPlace | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  // Live GPS location
  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported on this device");
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);
        setLocationError(null);
        setIsLoading(false);
      },
      (err) => {
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enable it in your browser settings."
            : "Could not determine your location. Try again."
        );
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  // Fetch nearby places whenever origin/type/radius changes
  useEffect(() => {
    if (!origin) return;
    const controller = new AbortController();
    setIsLoading(true);
    fetch(`/api/nearby?lat=${origin.lat}&lng=${origin.lng}&radius=${radius}&type=${type}&limit=20`, {
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("nearby failed");
        return r.json();
      })
      .then((data) => {
        setPlaces(data.results);
        setSource(data.source);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        showToast("Could not load nearby places", "error");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [origin, type, radius, showToast]);

  // OSRM turn-by-turn route to a target
  const showRoute = async (place: NearbyPlace) => {
    if (!origin) return;
    setIsRouting(true);
    setRouteTarget(place);
    setRoute(null);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${place.lng},${place.lat}?overview=false&steps=true`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("routing failed");
      const data = await response.json();
      if (data.code !== "Ok" || !data.routes?.length) throw new Error("no route");
      const leg = data.routes[0].legs[0];
      setRoute({
        distanceKm: Math.round(data.routes[0].distance / 100) / 10,
        durationMin: Math.round(data.routes[0].duration / 60),
        steps: leg.steps.map(
          (s: { maneuver: { type: string; modifier?: string }; name: string; distance: number }) => ({
            instruction: s.maneuver.type === "depart" ? "Start" : s.maneuver.type === "arrive" ? "Arrive" : `${s.maneuver.modifier || ""} turn`.trim(),
            name: s.name || "",
            distance: Math.round(s.distance),
          })
        ),
      });
    } catch {
      showToast("Route could not be calculated. Check your connection.", "error");
      setRouteTarget(null);
    } finally {
      setIsRouting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">📍 Nearby Discovery</h1>
          <p className="text-gray-500 mt-1">Live GPS-based places around you with turn-by-turn directions</p>
        </div>
        <DataStatusBadge status={source === "OpenStreetMap" ? "LIVE" : "ESTIMATED"} />
      </div>

      {/* Location status */}
      <Card className="mb-6 bg-gradient-to-br from-bangladesh-green to-bangladesh-green/90 text-white">
        {origin ? (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-green-100">Your live location</p>
              <p className="font-mono text-sm">
                {origin.lat.toFixed(5)}, {origin.lng.toFixed(5)}
                {accuracy && <span className="text-green-200 ml-2">±{Math.round(accuracy)}m</span>}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={locate} isLoading={isLoading}>
              🔄 Refresh GPS
            </Button>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="mb-3">{locationError || "Getting your location…"}</p>
            <Button variant="secondary" size="sm" onClick={locate} isLoading={isLoading}>
              📍 Enable Location
            </Button>
          </div>
        )}
      </Card>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Select
          label="Place type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={typeOptions}
        />
        <Select
          label="Within radius"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          options={[
            { value: "1", label: "1 km (walking)" },
            { value: "2", label: "2 km" },
            { value: "5", label: "5 km (rickshaw)" },
            { value: "10", label: "10 km" },
            { value: "25", label: "25 km" },
          ]}
        />
      </div>

      {/* Results */}
      {isLoading && places.length === 0 ? (
        <p className="text-center text-gray-500 py-8">Loading nearby places…</p>
      ) : !origin ? (
        <Card className="text-center py-8 text-gray-500">
          Enable location to discover places around you.
        </Card>
      ) : places.length === 0 ? (
        <Card className="text-center py-8 text-gray-500">
          No places found within {radius} km. Try a larger radius.
        </Card>
      ) : (
        <div className="space-y-3">
          {places.map((place) => (
            <Card key={place.id} hover className="!p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{iconFor(place.type)}</span>
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{place.name}</h3>
                    {place.nameBn && <p className="text-xs text-gray-500 truncate">{place.nameBn}</p>}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="brand">{place.distanceKm} km away</Badge>
                      {place.address && (
                        <span className="text-xs text-gray-400 truncate max-w-[220px]">{place.address}</span>
                      )}
                      {place.phone && (
                        <a href={`tel:${place.phone}`} className="text-xs text-bangladesh-green hover:underline">
                          📞 {place.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => showRoute(place)}
                  disabled={isRouting}
                  className="shrink-0"
                >
                  🧭 Route
                </Button>
              </div>

              {/* Turn-by-turn panel */}
              {routeTarget?.id === place.id && (
                <div className="mt-4 border-t pt-3">
                  {route ? (
                    <>
                      <div className="flex items-center gap-3 mb-3 text-sm flex-wrap">
                        <Badge variant="success">🚗 {route.distanceKm} km</Badge>
                        <Badge variant="info">⏱ ~{route.durationMin} min drive</Badge>
                        <a
                          className="text-xs text-gray-400 hover:underline"
                          href={`https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${place.lat},${place.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open in Google Maps ↗
                        </a>
                      </div>
                      <ol className="space-y-1.5 text-sm text-gray-600 max-h-56 overflow-y-auto">
                        {route.steps.map((step, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-bangladesh-green font-medium shrink-0">{i + 1}.</span>
                            <span>
                              <span className="font-medium capitalize">{step.instruction}</span>
                              {step.name ? ` onto ${step.name}` : ""} — {step.distance} m
                            </span>
                          </li>
                        ))}
                      </ol>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Calculating route…</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

