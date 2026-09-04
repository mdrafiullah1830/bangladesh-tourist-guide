import { NextRequest, NextResponse } from "next/server";
import type { PublicPlace } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const inputSchema = z.object({
  days: z.number().int().min(1).max(30),
  travellers: z.number().int().min(1).max(10),
  budget: z.number().min(1_000).max(10_000_000),
  interests: z.array(z.string().max(30)).max(12).default([]),
  travelStyle: z.string().max(30).default("solo"),
  arrivalAirport: z.enum(["DAC", "CGP", "ZYL", "CXB"]),
});

const AIRPORTS = {
  DAC: { city: "Dhaka", lat: 23.8433, lng: 90.3978 },
  CGP: { city: "Chattogram", lat: 22.2496, lng: 91.8133 },
  ZYL: { city: "Sylhet", lat: 24.9633, lng: 91.8668 },
  CXB: { city: "Cox's Bazar", lat: 21.4522, lng: 91.9639 },
};

const ALLOWED_SUBTYPES: Record<string, string[]> = {
  attraction: [
    "attraction", "museum", "viewpoint", "picnic_site", "monument", "memorial", "castle", "fort",
    "ruins", "archaeological_site", "city_gate", "manor", "palace", "tomb", "beach", "peak",
    "waterfall", "cave_entrance", "spring", "wetland",
  ],
  food: ["restaurant", "cafe", "fast_food", "food_court"],
  accommodation: ["hotel", "guest_house", "hostel", "motel", "resort", "camp_site"],
  transport: ["station", "halt", "bus_station", "ferry_terminal", "aerodrome", "terminal"],
};

function findPlaces(category: string, lat: number, lng: number, take: number) {
  const radius = 0.25;
  return prisma.publicPlace.findMany({
    where: {
      category,
      subtype: { in: ALLOWED_SUBTYPES[category] },
      qualityScore: { gte: 0.45 },
      latitude: { gte: lat - radius, lte: lat + radius },
      longitude: { gte: lng - radius, lte: lng + radius },
    },
    orderBy: [{ qualityScore: "desc" }, { name: "asc" }],
    take,
  });
}

function distanceKm(lat: number, lng: number, place: PublicPlace) {
  const toRadians = (value: number) => value * Math.PI / 180;
  const dLat = toRadians(place.latitude - lat);
  const dLng = toRadians(place.longitude - lng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat)) * Math.cos(toRadians(place.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function rankByInterests(places: PublicPlace[], interests: string[], lat: number, lng: number) {
  const terms = interests.map((value) => value.toLowerCase());
  return [...places].sort((a, b) => {
    const score = (place: PublicPlace) => {
      const text = `${place.name} ${place.subtype || ""}`.toLowerCase();
      return place.qualityScore + terms.filter((term) => text.includes(term)).length * 0.25
        - distanceKm(lat, lng, place) * 0.01;
    };
    return score(b) - score(a);
  });
}

export async function POST(request: NextRequest) {
  try {
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid trip preferences", details: parsed.error.flatten() }, { status: 400 });
    }
    const input = parsed.data;
    const airport = AIRPORTS[input.arrivalAirport];
    const [rawAttractions, restaurants, hotels, transport] = await Promise.all([
      findPlaces("attraction", airport.lat, airport.lng, 60),
      findPlaces("food", airport.lat, airport.lng, 30),
      findPlaces("accommodation", airport.lat, airport.lng, 20),
      findPlaces("transport", airport.lat, airport.lng, 20),
    ]);
    const attractions = rankByInterests(rawAttractions, input.interests, airport.lat, airport.lng);
    const rankedRestaurants = rankByInterests(restaurants, ["restaurant", "food"], airport.lat, airport.lng);
    const rankedHotels = rankByInterests(hotels, ["hotel"], airport.lat, airport.lng);
    const rankedTransport = rankByInterests(transport, [], airport.lat, airport.lng);
    if (attractions.length < 2) {
      return NextResponse.json({ error: "Not enough public place data near this airport" }, { status: 422 });
    }

    const dailyBudget = input.budget / input.days;
    const days = Array.from({ length: input.days }, (_, index) => {
      const morning = attractions[(index * 2) % attractions.length];
      const afternoon = attractions[(index * 2 + 1) % attractions.length];
      const lunch = rankedRestaurants[index % Math.max(rankedRestaurants.length, 1)];
      return {
        dayNumber: index + 1,
        location: airport.city,
        activities: [
          {
            title: morning.name, type: "attraction", time: "09:00", startTime: "09:00",
            cost: Math.round(dailyBudget * 0.2), location: morning.address || airport.city,
            latitude: morning.latitude, longitude: morning.longitude, sourceUrl: morning.sourceUrl,
          },
          {
            title: lunch?.name || "Local restaurant", type: "food", time: "12:30", startTime: "12:30",
            cost: Math.round(dailyBudget * 0.15), location: lunch?.address || airport.city,
            latitude: lunch?.latitude, longitude: lunch?.longitude, sourceUrl: lunch?.sourceUrl,
          },
          {
            title: afternoon.name, type: "attraction", time: "14:30", startTime: "14:30",
            cost: Math.round(dailyBudget * 0.25), location: afternoon.address || airport.city,
            latitude: afternoon.latitude, longitude: afternoon.longitude, sourceUrl: afternoon.sourceUrl,
          },
          {
            title: "Dinner & rest", type: "food", time: "19:00", startTime: "19:00",
            cost: Math.round(dailyBudget * 0.2), location: airport.city,
          },
        ],
      };
    });

    const totalCost = days.reduce(
      (total, day) => total + day.activities.reduce((sum, activity) => sum + activity.cost, 0), 0,
    );
    const recommendedHotel = rankedHotels[0];
    const nearbyTransport = rankedTransport[0];
    return NextResponse.json({
      days,
      totalCost,
      transportOptions: [{
        mode: nearbyTransport?.subtype === "station" ? "train" : "bus",
        from: `${input.arrivalAirport} Airport`, to: airport.city,
        duration: "Verify locally", fare: Math.round(dailyBudget * 0.08), recommendation: "nearest public-data option",
      }],
      recommendations: [recommendedHotel, ...rankedHotels.slice(1, 3)]
        .filter((place): place is PublicPlace => Boolean(place))
        .map((place) => ({
        id: place.id, name: place.name, type: "hotel", sourceUrl: place.sourceUrl, qualityScore: place.qualityScore,
        })),
      sourceCount: attractions.length + restaurants.length + hotels.length + transport.length,
      baseCity: airport.city,
      dataStatus: "LAST_UPDATED",
    });
  } catch (error) {
    console.error("Trip plan generation error:", error);
    return NextResponse.json({ error: "Unable to generate trip plan" }, { status: 500 });
  }
}
