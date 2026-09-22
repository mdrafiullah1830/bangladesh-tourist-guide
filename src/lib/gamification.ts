// ============ GAMIFICATION ENGINE ============
// Client-side achievement tracking stored in localStorage (no backend needed).

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold";
}

export interface GamificationState {
  points: number;
  earnedBadges: string[];
  stats: {
    reviewsWritten: number;
    diaryEntries: number;
    destinationsFavourited: number;
    tripsPlanned: number;
    routesRequested: number;
  };
}

const STORAGE_KEY = "bdg_gamification_v1";

const DEFAULT_STATE: GamificationState = {
  points: 0,
  earnedBadges: [],
  stats: {
    reviewsWritten: 0,
    diaryEntries: 0,
    destinationsFavourited: 0,
    tripsPlanned: 0,
    routesRequested: 0,
  },
};

export const POINT_VALUES: Record<keyof GamificationState["stats"], number> = {
  reviewsWritten: 25,
  diaryEntries: 20,
  destinationsFavourited: 10,
  tripsPlanned: 50,
  routesRequested: 5,
};

export const ALL_BADGES: Badge[] = [
  { id: "first-review", title: "First Words", description: "Write your first review", icon: "✍️", tier: "bronze" },
  { id: "review-5", title: "Trusted Reviewer", description: "Write 5 reviews", icon: "🌟", tier: "silver" },
  { id: "first-diary", title: "Dear Diary", description: "Write your first diary entry", icon: "📖", tier: "bronze" },
  { id: "diary-5", title: "Storyteller", description: "Write 5 diary entries", icon: "📚", tier: "silver" },
  { id: "first-favourite", title: "Wishlisted", description: "Save your first favourite place", icon: "❤️", tier: "bronze" },
  { id: "favourite-10", title: "Collector", description: "Save 10 favourite places", icon: "💎", tier: "gold" },
  { id: "first-trip", title: "Trip Planner", description: "Plan your first trip", icon: "🗺️", tier: "bronze" },
  { id: "explorer", title: "Explorer", description: "Request 10 navigation routes", icon: "🧭", tier: "silver" },
  { id: "point-100", title: "Centurion", description: "Earn 100 points", icon: "🏆", tier: "gold" },
];

export function getGamificationState(): GamificationState {
  if (typeof window === "undefined") return structuredClone(DEFAULT_STATE);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw) as GamificationState;
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      stats: { ...DEFAULT_STATE.stats, ...parsed.stats },
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState(state: GamificationState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function evaluateBadges(state: GamificationState): string[] {
  const s = state.stats;
  const earned = new Set(state.earnedBadges);
  if (s.reviewsWritten >= 1) earned.add("first-review");
  if (s.reviewsWritten >= 5) earned.add("review-5");
  if (s.diaryEntries >= 1) earned.add("first-diary");
  if (s.diaryEntries >= 5) earned.add("diary-5");
  if (s.destinationsFavourited >= 1) earned.add("first-favourite");
  if (s.destinationsFavourited >= 10) earned.add("favourite-10");
  if (s.tripsPlanned >= 1) earned.add("first-trip");
  if (s.routesRequested >= 10) earned.add("explorer");
  if (state.points >= 100) earned.add("point-100");
  return Array.from(earned);
}

/**
 * Records an activity and returns newly earned badges (if any).
 * Safe to call from any client component.
 */
export function recordActivity(
  activity: keyof GamificationState["stats"],
  times = 1
): { state: GamificationState; newBadges: Badge[] } {
  const state = getGamificationState();
  state.stats[activity] += times;
  state.points += POINT_VALUES[activity] * times;
  const before = new Set(state.earnedBadges);
  state.earnedBadges = evaluateBadges(state);
  saveState(state);

  const newBadges = ALL_BADGES.filter((b) => state.earnedBadges.includes(b.id) && !before.has(b.id));
  return { state, newBadges };
}

export function getBadgeById(id: string): Badge | undefined {
  return ALL_BADGES.find((b) => b.id === id);
}

export function getLevel(points: number): { level: number; title: string; nextLevelPoints: number | null } {
  const levels = [
    { min: 0, title: "Wanderer" },
    { min: 50, title: "Pathfinder" },
    { min: 150, title: "Explorer" },
    { min: 300, title: "Globetrotter" },
    { min: 600, title: "Legend of Bangladesh" },
  ];
  let level = 1;
  for (let i = 0; i < levels.length; i++) {
    if (points >= levels[i].min) level = i + 1;
  }
  const next = levels[level];
  return {
    level,
    title: levels[level - 1].title,
    nextLevelPoints: next ? next.min : null,
  };
}
