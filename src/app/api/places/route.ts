import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

function markerType(category: string, subtype: string | null) {
  if (category === "accommodation") return "hotel";
  if (category === "food") return "restaurant";
  if (category === "emergency") return subtype === "police" ? "police" : "hospital";
  if (category === "transport") return subtype === "aerodrome" ? "airport" : "station";
  return "attraction";
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type") || "all";
  const query = (params.get("q") || "").trim().slice(0, 80);
  const requestedLimit = Number.parseInt(params.get("limit") || "250", 10);
  const requestedOffset = Number.parseInt(params.get("offset") || "0", 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 250;
  const offset = Number.isFinite(requestedOffset) ? Math.min(Math.max(requestedOffset, 0), 10_000) : 0;

  const where: Prisma.PublicPlaceWhereInput = {
    ...(TYPE_FILTERS[type] || {}),
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
      prisma.publicPlace.findMany({ where, orderBy: { name: "asc" }, skip: offset, take: limit }),
      prisma.publicPlace.count({ where }),
    ]);
    const points = places.map((place) => ({
      id: place.id,
      name: place.name,
      type: markerType(place.category, place.subtype),
      lat: place.latitude,
      lng: place.longitude,
      description: place.subtype || place.category,
      district: place.district,
      source: place.source,
      sourceUrl: place.sourceUrl,
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
