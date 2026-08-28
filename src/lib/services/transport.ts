import { prisma } from "@/lib/prisma";
import type { TransportOption, NearbyResult } from "@/lib/types";

// ============ TRANSPORT SERVICE ============

export interface TransportSearchParams {
  from: string;
  to: string;
  date?: Date;
  mode?: "bus" | "train" | "flight" | "launch" | "all";
  sortBy?: "cheapest" | "fastest" | "recommended";
}

// Mock transport database - in production, this would come from a real API
const transportDatabase: TransportOption[] = [
  // Dhaka to Chattogram
  {
    id: "dhk-ctg-bus1",
    mode: "bus",
    operator: "Green Line Paribahan",
    from: "Dhaka",
    to: "Chattogram",
    departurePoint: "Sayedabad",
    arrivalPoint: "Dampara",
    duration: "5-6 hours",
    durationMinutes: 330,
    distanceKm: 265,
    fare: { min: 900, max: 1500, economy: 900, business: 1500 },
    comfort: "premium",
    schedule: "Multiple daily departures",
    frequency: "Every 2 hours",
    recommendation: "recommended",
    dataStatus: "ESTIMATED",
    lastUpdated: new Date(),
  },
  {
    id: "dhk-ctg-bus2",
    mode: "bus",
    operator: "Shohag Paribahan",
    from: "Dhaka",
    to: "Chattogram",
    departurePoint: "Sayedabad",
    arrivalPoint: "Dampara",
    duration: "5-7 hours",
    durationMinutes: 360,
    distanceKm: 265,
    fare: { min: 600, max: 900, economy: 600 },
    comfort: "standard",
    schedule: "Every 1 hour",
    recommendation: "cheapest",
    dataStatus: "ESTIMATED",
    lastUpdated: new Date(),
  },
  {
    id: "dhk-ctg-train1",
    mode: "train",
    operator: "Subarna Express",
    from: "Dhaka",
    to: "Chattogram",
    departurePoint: "Kamalapur Railway Station",
    arrivalPoint: "Chattogram Railway Station",
    duration: "6-7 hours",
    durationMinutes: 390,
    distanceKm: 320,
    fare: { min: 300, max: 1200, economy: 300, business: 1200 },
    comfort: "standard",
    schedule: "Daily 7:00 AM",
    recommendation: "fastest",
    dataStatus: "ESTIMATED",
    lastUpdated: new Date(),
  },
  {
    id: "dhk-ctg-flight1",
    mode: "flight",
    operator: "US-Bangla Airlines",
    from: "Dhaka",
    to: "Chattogram",
    departurePoint: "Hazrat Shahjalal Int'l Airport",
    arrivalPoint: "Shah Amanat Int'l Airport",
    duration: "45 mins",
    durationMinutes: 45,
    distanceKm: 250,
    fare: { min: 3500, max: 6000, economy: 3500 },
    comfort: "premium",
    schedule: "Multiple daily flights",
    recommendation: "fastest",
    dataStatus: "ESTIMATED",
    lastUpdated: new Date(),
  },
  // Dhaka to Cox's Bazar
  {
    id: "dhk-cox-bus1",
    mode: "bus",
    operator: "S Alam Paribahan",
    from: "Dhaka",
    to: "Cox's Bazar",
    departurePoint: "Sayedabad",
    arrivalPoint: "Cox's Bazar Bus Terminal",
    duration: "8-10 hours",
    durationMinutes: 540,
    distanceKm: 420,
    fare: { min: 800, max: 1600, economy: 800, business: 1600 },
    comfort: "standard",
    schedule: "Multiple daily",
    recommendation: "recommended",
    dataStatus: "ESTIMATED",
    lastUpdated: new Date(),
  },
  {
    id: "dhk-cox-flight1",
    mode: "flight",
    operator: "US-Bangla Airlines",
    from: "Dhaka",
    to: "Cox's Bazar",
    departurePoint: "Hazrat Shahjalal Int'l Airport",
    arrivalPoint: "Cox's Bazar Airport",
    duration: "55 mins",
    durationMinutes: 55,
    distanceKm: 300,
    fare: { min: 4000, max: 7000, economy: 4000 },
    comfort: "premium",
    schedule: "Daily flights",
    recommendation: "fastest",
    dataStatus: "ESTIMATED",
    lastUpdated: new Date(),
  },
  // Dhaka to Sylhet
  {
    id: "dhk-syl-bus1",
    mode: "bus",
    operator: "Ena Transport",
    from: "Dhaka",
    to: "Sylhet",
    departurePoint: "Mohakhali",
    arrivalPoint: "Sylhet Terminal",
    duration: "5-6 hours",
    durationMinutes: 330,
    distanceKm: 240,
    fare: { min: 500, max: 900, economy: 500 },
    comfort: "standard",
    schedule: "Every 30 mins",
    recommendation: "cheapest",
    dataStatus: "ESTIMATED",
    lastUpdated: new Date(),
  },
  {
    id: "dhk-syl-train1",
    mode: "train",
    operator: "Parabat Express",
    from: "Dhaka",
    to: "Sylhet",
    departurePoint: "Kamalapur Railway Station",
    arrivalPoint: "Sylhet Railway Station",
    duration: "6-7 hours",
    durationMinutes: 390,
    distanceKm: 260,
    fare: { min: 250, max: 1000, economy: 250 },
    comfort: "standard",
    schedule: "Daily 7:00 AM",
    recommendation: "recommended",
    dataStatus: "ESTIMATED",
    lastUpdated: new Date(),
  },
  // Chattogram to Cox's Bazar
  {
    id: "ctg-cox-bus1",
    mode: "bus",
    operator: "S Alam Paribahan",
    from: "Chattogram",
    to: "Cox's Bazar",
    departurePoint: "Dampara",
    arrivalPoint: "Cox's Bazar Bus Terminal",
    duration: "3-4 hours",
    durationMinutes: 210,
    distanceKm: 155,
    fare: { min: 300, max: 600, economy: 300 },
    comfort: "standard",
    schedule: "Every 30 mins",
    recommendation: "recommended",
    dataStatus: "ESTIMATED",
    lastUpdated: new Date(),
  },
  // Dhaka to Sundarbans
  {
    id: "dhk-sun-launch1",
    mode: "launch",
    operator: "Private Launch Service",
    from: "Dhaka",
    to: "Sundarbans",
    departurePoint: "Sadarghat River Terminal",
    arrivalPoint: "Mongla/Hiron Point",
    duration: "18-24 hours",
    durationMinutes: 1320,
    distanceKm: 350,
    fare: { min: 800, max: 3000, economy: 800, business: 3000 },
    comfort: "standard",
    schedule: "3-4 times weekly",
    recommendation: "recommended",
    dataStatus: "ESTIMATED",
    lastUpdated: new Date(),
  },
];

export async function searchTransport(params: TransportSearchParams): Promise<TransportOption[]> {
  const { from, to, mode = "all", sortBy = "recommended" } = params;

  let results = transportDatabase.filter(
    (t) =>
      t.from.toLowerCase().includes(from.toLowerCase()) &&
      t.to.toLowerCase().includes(to.toLowerCase())
  );

  if (mode !== "all") {
    results = results.filter((t) => t.mode === mode);
  }

  // Sort results
  if (sortBy === "cheapest") {
    results.sort((a, b) => (a.fare?.min || 0) - (b.fare?.min || 0));
  } else if (sortBy === "fastest") {
    results.sort((a, b) => (a.durationMinutes || 0) - (b.durationMinutes || 0));
  } else {
    // Recommended: balance of cost and time
    results.sort((a, b) => {
      const scoreA = getRecommendationScore(a);
      const scoreB = getRecommendationScore(b);
      return scoreB - scoreA;
    });
  }

  return results;
}

function getRecommendationScore(option: TransportOption): number {
  const fare = option.fare?.min || 1000;
  const duration = option.durationMinutes || 300;
  const comfortBonus = option.comfort === "premium" ? 20 : option.comfort === "standard" ? 10 : 0;
  
  // Lower fare is better, lower duration is better
  return (1000 / fare) * 50 + (500 / duration) * 30 + comfortBonus;
}

export function getAllTransportRoutes(): TransportOption[] {
  return transportDatabase;
}

export function getTransportModes(): { id: string; name: string; icon: string }[] {
  return [
    { id: "bus", name: "Bus", icon: "🚌" },
    { id: "train", name: "Train", icon: "🚂" },
    { id: "flight", name: "Flight", icon: "✈️" },
    { id: "launch", name: "Launch/Ship", icon: "🚢" },
    { id: "rickshaw", name: "Rickshaw", icon: "🛺" },
    { id: "car", name: "Car/Taxi", icon: "🚗" },
  ];
}

// ============ LOCATION/MAP SERVICE ============

export interface MapPoint {
  id: string;
  name: string;
  type: "attraction" | "hotel" | "restaurant" | "hospital" | "police" | "atm" | "airport" | "station";
  lat: number;
  lng: number;
  description?: string;
  district?: string;
}

const mapPoints: MapPoint[] = [
  // Airports
  { id: "apt-dac", name: "Hazrat Shahjalal International Airport", type: "airport", lat: 23.8433, lng: 90.3978, district: "Dhaka" },
  { id: "apt-cgp", name: "Shah Amanat International Airport", type: "airport", lat: 22.2496, lng: 91.8133, district: "Chattogram" },
  { id: "apt-zyl", name: "Osmani International Airport", type: "airport", lat: 24.9633, lng: 91.8668, district: "Sylhet" },
  { id: "apt-cxb", name: "Cox's Bazar Airport", type: "airport", lat: 21.4522, lng: 91.9639, district: "Cox's Bazar" },
  
  // Hospitals
  { id: "hosp-square", name: "Square Hospital", type: "hospital", lat: 23.7534, lng: 90.3834, description: "Leading private hospital", district: "Dhaka" },
  { id: "hosp-labaid", name: "Labaid Specialized Hospital", type: "hospital", lat: 23.7465, lng: 90.3832, description: "Multi-specialty hospital", district: "Dhaka" },
  { id: "hosp-ctic", name: "Chittagong Medical College Hospital", type: "hospital", lat: 22.3420, lng: 91.8150, district: "Chattogram" },
  { id: "hosp-cox", name: "Cox's Bazar Sadar Hospital", type: "hospital", lat: 21.4350, lng: 92.0100, district: "Cox's Bazar" },
  
  // Police
  { id: "pol-dhanmondi", name: "Dhanmondi Police Station", type: "police", lat: 23.7465, lng: 90.3762, district: "Dhaka" },
  { id: "pol-gulshan", name: "Gulshan Police Station", type: "police", lat: 23.7925, lng: 90.4148, district: "Dhaka" },
  { id: "pol-ctg", name: "Kotwali Police Station", type: "police", lat: 22.3384, lng: 91.8317, district: "Chattogram" },
  
  // Stations
  { id: "stn-kamalapur", name: "Kamalapur Railway Station", type: "station", lat: 23.7276, lng: 90.4262, district: "Dhaka" },
  { id: "stn-ctg", name: "Chattogram Railway Station", type: "station", lat: 22.3400, lng: 91.8200, district: "Chattogram" },
  { id: "stn-sadarghat", name: "Sadarghat River Terminal", type: "station", lat: 23.7084, lng: 90.4103, district: "Dhaka" },
];

export function getMapPoints(type?: string, district?: string): MapPoint[] {
  let points = mapPoints;
  if (type) {
    points = points.filter((p) => p.type === type);
  }
  if (district) {
    points = points.filter((p) => p.district?.toLowerCase().includes(district.toLowerCase()));
  }
  return points;
}

export function getNearbyPoints(lat: number, lng: number, radiusKm: number = 10): NearbyResult[] {
  return mapPoints
    .map((p) => ({
      ...p,
      distance: calculateDistance(lat, lng, p.lat, p.lng),
    }))
    .filter((p) => p.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const districtCoordinates: Record<string, { lat: number; lng: number }> = {
  dhaka: { lat: 23.8103, lng: 90.4125 },
  chattogram: { lat: 22.3569, lng: 91.7832 },
  "cox's bazar": { lat: 21.4272, lng: 92.0058 },
  sylhet: { lat: 24.8949, lng: 91.8687 },
  khulna: { lat: 22.8456, lng: 89.5403 },
  rajshahi: { lat: 24.3745, lng: 88.6042 },
  barishal: { lat: 22.7010, lng: 90.3535 },
  rangpur: { lat: 25.7439, lng: 89.2752 },
  mymensingh: { lat: 24.7471, lng: 90.4203 },
};
