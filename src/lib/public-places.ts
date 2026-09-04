export type PlaceQualityInput = {
  name: string;
  category?: string | null;
  name_bn?: string | null;
  name_en?: string | null;
  subtype?: string | null;
  district?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  opening_hours?: string | null;
  wheelchair?: string | null;
};

export function calculatePlaceQuality(place: PlaceQualityInput) {
  let score = place.name.trim() ? 0.25 : 0;
  if (place.subtype) score += 0.1;
  if (place.name_bn || place.name_en) score += 0.1;
  if (place.district) score += 0.1;
  if (place.address) score += 0.1;
  if (place.phone) score += 0.1;
  if (place.website) score += 0.1;
  if (place.opening_hours) score += 0.05;
  if (place.wheelchair) score += 0.05;
  const name = place.name.toLowerCase();
  const mismatchTerms: Record<string, string[]> = {
    accommodation: ["hospital", "clinic", "mosque", "masjid", "college", "school", "university", "restaurant", "cafe", "coffee", "pizza"],
    attraction: ["hospital", "clinic", "college", "school", "university", "pharmacy", "online", "bhandar"],
    food: ["hospital", "clinic", "mosque", "masjid", "college", "school", "university", "community center"],
  };
  if (place.name.trim().length < 4 || (place.category && mismatchTerms[place.category]?.some((term) => name.includes(term)))) {
    score = Math.min(score, 0.3);
  }
  score = Math.min(1, Number(score.toFixed(2)));
  return { score, tier: score >= 0.7 ? "high" : score >= 0.45 ? "medium" : "low" };
}

export function publicCategoryToMarkerType(category: string, subtype: string | null) {
  if (category === "accommodation") return "hotel";
  if (category === "food") return "restaurant";
  if (category === "emergency") return subtype === "police" ? "police" : "hospital";
  if (category === "transport") return subtype === "aerodrome" ? "airport" : "station";
  return "attraction";
}
