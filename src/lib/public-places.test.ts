import { describe, expect, it } from "vitest";
import { calculatePlaceQuality, publicCategoryToMarkerType } from "./public-places";

describe("public place quality", () => {
  it("keeps sparse source records in the low tier", () => {
    expect(calculatePlaceQuality({ name: "A Place", subtype: "attraction" })).toEqual({ score: 0.35, tier: "low" });
  });

  it("rewards useful contact and verification fields", () => {
    expect(calculatePlaceQuality({
      name: "Museum", name_bn: "জাদুঘর", subtype: "museum", district: "Dhaka",
      address: "Shahbag", phone: "999", website: "https://example.test", opening_hours: "10:00-17:00",
    })).toEqual({ score: 0.9, tier: "high" });
  });

  it("maps public categories to supported map marker types", () => {
    expect(publicCategoryToMarkerType("emergency", "police")).toBe("police");
    expect(publicCategoryToMarkerType("transport", "aerodrome")).toBe("airport");
    expect(publicCategoryToMarkerType("food", "restaurant")).toBe("restaurant");
  });

  it("penalizes obvious category mismatches", () => {
    expect(calculatePlaceQuality({
      name: "Central Mosque", category: "accommodation", subtype: "guest_house",
      address: "Dhaka", phone: "123", website: "https://example.test",
    })).toEqual({ score: 0.3, tier: "low" });
    expect(calculatePlaceQuality({
      name: "Example Coffee Company", category: "accommodation", subtype: "hotel", website: "https://example.test",
    })).toEqual({ score: 0.3, tier: "low" });
  });
});
