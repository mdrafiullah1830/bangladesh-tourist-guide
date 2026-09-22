import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getNearbyPoints } from "@/lib/services/transport";

export const dynamic = "force-dynamic";

const TYPE_FILTERS: Record<string, Prisma.PublicPlaceWhereInput> = {
  attraction: { category: "attraction" },
  hotel: { category: "accommodation" },
  restaurant: { category: "food" },
  hospital: { category: "emergency", subtype: { in: ["hospital", "clinic", "ambulance_station"] } },
  police: { category: "emergency", subtype: "police" },
  airport: { category: "transport", subtype: "aerodrome" },
  station: { category: "transport", subtype: { in: ["station", "halt", "bus_station", "ferry_terminal", "terminal"] } },
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * GET /api/nearby?lat=23.8&lng=90.4&radius=10&type=hospital&limit=20
 * Live GPS based discovery from the public OpenStreetMap dataset,
 * with a static fallback if the database is unavailable.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = Number.parseFloat(params.get("lat") || "");
  const lng = Number.parseFloat(params.get("lng") || "");
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Valid lat and lng are required" }, { status: 400 });
  }

  const radiusKm = Math.min(Math.max(Number.parseFloat(params.get("radius") || "10"), 0.5), 50);
  const type = params.get("type") || "all";
  const limit = Math.min(Math.max(Number.parseInt(params.get("limit") || "20", 10), 1), 50);

  // Bounding-box prefilter (~1 deg ≈ 111km); refined with haversine below.
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
  const where: Prisma.PublicPlaceWhereInput = {
    qualityScore: { gte: 0.3 },
    latitude: { gte: lat - latDelta, lte: lat + latDelta },
    longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
    ...(TYPE_FILTERS[type] || {}),
  };

  try {
    const places = await prisma.publicPlace.findMany({
      where,
      orderBy: { qualityScore: "desc" },
      take: limit * 4, // overfetch, then rank by true distance
    });

    const results = places
      .map((p) => ({
        id: p.id,
        name: p.name,
        nameBn: p.nameBn,
        type: p.subtype || p.category,
        lat: p.latitude,
        lng: p.longitude,
        address: p.address,
        phone: p.phone,
        distanceKm: Math.round(haversineKm(lat, lng, p.latitude, p.longitude) * 100) / 100,
      }))
      .filter((p) => p.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    return NextResponse.json({ results, origin: { lat, lng }, radiusKm, source: "OpenStreetMap" });
  } catch (error) {
    console.error("Nearby fetch error:", error);
    // Static fallback so the page still works without the database.
    const fallback = getNearbyPoints(lat, lng, radiusKm).slice(0, limit).map((p) => ({
      id: p.id,
      name: p.name,
      nameBn: null,
      type: p.type,
      lat: p.lat,
      lng: p.lng,
      address: "description" in p && typeof p.description === "string" ? p.description : null,
      phone: null,
      distanceKm: Math.round((p.distance ?? 0) * 100) / 100,
    }));
    return NextResponse.json({ results: fallback, origin: { lat, lng }, radiusKm, source: "static-fallback" });
  }
}
