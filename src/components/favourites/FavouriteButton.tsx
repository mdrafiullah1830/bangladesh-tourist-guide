"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { recordActivity } from "@/lib/gamification";

interface FavouriteButtonProps {
  itemType: "destination" | "hotel" | "restaurant" | "attraction";
  itemId: string;
  currentUserId?: string | null;
}

/**
 * Heart toggle that persists the current user's favourite items.
 * Falls back gracefully: guests are prompted to sign in via toast-style title.
 */
export function FavouriteButton({ itemType, itemId, currentUserId }: FavouriteButtonProps) {
  const [isFavourite, setIsFavourite] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);

  useEffect(() => {
    let active = true;
    if (!currentUserId) return;
    fetch(`/api/favourites`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("unauthorized"))))
      .then((data: { favourites: { itemType: string; itemId: string }[] }) => {
        if (!active) return;
        setIsFavourite(
          data.favourites.some((f) => f.itemType === itemType && f.itemId === itemId)
        );
      })
      .catch(() => {
        /* not signed in or network issue — button stays off */
      });
    return () => {
      active = false;
    };
  }, [currentUserId, itemType, itemId]);

  const toggle = async () => {
    if (!currentUserId) {
      setShowLoginHint(true);
      window.setTimeout(() => setShowLoginHint(false), 2500);
      return;
    }
    setIsBusy(true);
    try {
      if (isFavourite) {
        const response = await fetch(
          `/api/favourites?itemType=${itemType}&itemId=${encodeURIComponent(itemId)}`,
          { method: "DELETE" }
        );
        if (!response.ok) throw new Error();
        setIsFavourite(false);
      } else {
        const response = await fetch("/api/favourites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemType, itemId }),
        });
        if (!response.ok) throw new Error();
        setIsFavourite(true);
        recordActivity("destinationsFavourited");
      }
    } catch {
      /* keep prior state on failure */
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={isBusy}
        aria-pressed={isFavourite}
        aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-md transition-all",
          "bg-white/90 backdrop-blur-sm hover:scale-110 active:scale-95 disabled:opacity-60",
          isFavourite ? "text-red-500" : "text-gray-400 hover:text-red-400"
        )}
      >
        {isFavourite ? "❤️" : "🤍"}
      </button>
      {showLoginHint && (
        <span className="absolute right-0 top-12 z-20 whitespace-nowrap bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg">
          <a href="/auth/login" className="hover:underline">Sign in to save favourites →</a>
        </span>
      )}
    </div>
  );
}
