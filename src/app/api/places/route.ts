import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publicCategoryToMarkerType } from "@/lib/public-places";

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

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type") || "all";
  const query = (params.get("q") || "").trim().slice(0, 80);
  const requestedLimit = Number.parseInt(params.get("limit") || "250", 10);
  const requestedOffset = Number.parseInt(params.get("offset") || "0", 10);
  const requestedQuality = Number.parseFloat(params.get("minQuality") || "0.35");
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 250;
  const offset = Number.isFinite(requestedOffset) ? Math.min(Math.max(requestedOffset, 0), 10_000) : 0;
  const minQuality = Number.isFinite(requestedQuality) ? Math.min(Math.max(requestedQuality, 0), 1) : 0.35;
  const north = Number.parseFloat(params.get("north") || "");
  const south = Number.parseFloat(params.get("south") || "");
  const east = Number.parseFloat(params.get("east") || "");
  const west = Number.parseFloat(params.get("west") || "");
  const hasBounds = [north, south, east, west].every(Number.isFinite) && north > south && east > west;

  const where: Prisma.PublicPlaceWhereInput = {
    ...(TYPE_FILTERS[type] || {}),
    qualityScore: { gte: minQuality },
    ...(hasBounds ? { latitude: { gte: south, lte: north }, longitude: { gte: west, lte: east } } : {}),
    ...(query ? {
      OR: [
        { name: { contains: query } },
        { nameBn: { contains: query } },
        { nameEn: { contains: query } },
        { district: { contains: query } },
      ],
    } : {}),
  };

  try {
    const [places, total] = await Promise.all([
      prisma.publicPlace.findMany({ where, orderBy: [{ qualityScore: "desc" }, { name: "asc" }], skip: offset, take: limit }),
      prisma.publicPlace.count({ where }),
    ]);
    const points = places.map((place) => ({
      id: place.id,
      name: place.name,
      type: publicCategoryToMarkerType(place.category, place.subtype),
      lat: place.latitude,
      lng: place.longitude,
      description: place.subtype || place.category,
      district: place.district,
      source: place.source,
      sourceUrl: place.sourceUrl,
      qualityScore: place.qualityScore,
      qualityTier: place.qualityTier,
    }));
    return NextResponse.json(
      { points, total, limit, offset, source: "OpenStreetMap" },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    console.error("Public places fetch error:", error);
    return NextResponse.json({ error: "Public places are unavailable" }, { status: 503 });
  }
}
