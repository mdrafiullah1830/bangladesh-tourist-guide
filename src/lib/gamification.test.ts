import { describe, it, expect } from "vitest";
import {
  getGamificationState,
  recordActivity,
  getBadgeById,
  getLevel,
  ALL_BADGES,
} from "./gamification";

function resetState() {
  window.localStorage.clear();
}

describe("gamification", () => {
  it("starts with a default state", () => {
    resetState();
    const state = getGamificationState();
    expect(state.points).toBe(0);
    expect(state.earnedBadges).toEqual([]);
    expect(state.stats.reviewsWritten).toBe(0);
  });

  it("awards points for activities", () => {
    resetState();
    const { state } = recordActivity("reviewsWritten");
    expect(state.points).toBe(25);
    expect(state.stats.reviewsWritten).toBe(1);
  });

  it("accumulates points across activities", () => {
    resetState();
    recordActivity("reviewsWritten"); // +25
    recordActivity("routesRequested", 2); // +5*2
    const state = getGamificationState();
    expect(state.points).toBe(35);
  });

  it("earns the first-review badge after one review", () => {
    resetState();
    const { newBadges } = recordActivity("reviewsWritten");
    expect(newBadges.some((b) => b.id === "first-review")).toBe(true);
  });

  it("does not re-earn the same badge", () => {
    resetState();
    recordActivity("reviewsWritten");
    const { newBadges } = recordActivity("reviewsWritten");
    expect(newBadges).toEqual([]);
  });

  it("earns the centurion badge at 100 points", () => {
    resetState();
    // 2 trips = 100 points
    recordActivity("tripsPlanned", 2);
    const state = getGamificationState();
    expect(state.earnedBadges).toContain("point-100");
    expect(state.earnedBadges).toContain("first-trip");
  });

  it("getBadgeById returns badge metadata", () => {
    const badge = getBadgeById("explorer");
    expect(badge?.title).toBe("Explorer");
    expect(badge?.tier).toBe("silver");
  });

  it("getLevel maps points to titles", () => {
    expect(getLevel(0).title).toBe("Wanderer");
    expect(getLevel(60).title).toBe("Pathfinder");
    expect(getLevel(1000).nextLevelPoints).toBeNull();
  });

  it("defines all badges with unique ids", () => {
    const ids = ALL_BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
