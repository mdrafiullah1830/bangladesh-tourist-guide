"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui/Card";
import {
  getGamificationState,
  getLevel,
  ALL_BADGES,
  type GamificationState,
} from "@/lib/gamification";

export default function AchievementsPage() {
  const [state, setState] = useState<GamificationState | null>(null);

  useEffect(() => {
    setState(getGamificationState());
  }, []);

  if (!state) {
    return <p className="text-center text-gray-500 py-16">Loading achievements…</p>;
  }

  const level = getLevel(state.points);
  const progress = level.nextLevelPoints
    ? Math.min(Math.round((state.points / level.nextLevelPoints) * 100), 100)
    : 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">🏆 Your Achievements</h1>
      <p className="text-gray-500 mb-6">Earn badges as you explore, review and document Bangladesh</p>

      {/* Level card */}
      <Card className="mb-6 bg-gradient-to-br from-bangladesh-green to-bangladesh-green/90 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-green-100">Level {level.level}</p>
            <p className="text-2xl font-bold">{level.title}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{state.points}</p>
            <p className="text-xs text-green-200">total points</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-green-100 mb-1">
            <span>Level {level.level}</span>
            <span>
              {level.nextLevelPoints
                ? `${state.points} / ${level.nextLevelPoints} pts to next level`
                : "Max level reached! 🎉"}
            </span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-bangladesh-gold rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </Card>

      {/* Badges grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {ALL_BADGES.map((badge) => {
          const earned = state.earnedBadges.includes(badge.id);
          return (
            <Card
              key={badge.id}
              className={`text-center ${earned ? "" : "opacity-40 grayscale"}`}
            >
              <div className="text-4xl mb-2">{badge.icon}</div>
              <h3 className="font-semibold text-gray-900 text-sm">{badge.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
              <div className="mt-2">
                {earned ? (
                  <Badge variant="success" size="md">✓ Earned</Badge>
                ) : (
                  <Badge variant="default" size="md">🔒 Locked</Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Stats */}
      <Card className="mt-6">
        <h3 className="font-semibold text-gray-900 mb-3">📊 Your Activity</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          {[
            { label: "Reviews", value: state.stats.reviewsWritten, icon: "✍️" },
            { label: "Diary Entries", value: state.stats.diaryEntries, icon: "📖" },
            { label: "Favourites", value: state.stats.destinationsFavourited, icon: "❤️" },
            { label: "Trips Planned", value: state.stats.tripsPlanned, icon: "🗺️" },
            { label: "Routes Taken", value: state.stats.routesRequested, icon: "🧭" },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-lg p-3">
              <div className="text-xl">{item.icon}</div>
              <div className="text-lg font-bold text-gray-900">{item.value}</div>
              <div className="text-xs text-gray-500">{item.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
