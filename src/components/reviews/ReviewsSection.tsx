"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, Badge, Skeleton } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn, formatDate } from "@/lib/utils";
import { recordActivity } from "@/lib/gamification";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string };
  isOwn?: boolean;
}

interface ReviewStats {
  count: number;
  averageRating: number;
  distribution: { star: number; count: number }[];
}

interface ReviewsSectionProps {
  itemType: "destination" | "hotel" | "restaurant" | "attraction";
  itemId: string;
  currentUserId?: string | null;
}

function StarRating({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const sizeCls = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg";
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={cn(
            sizeCls,
            onChange && "hover:scale-110 transition-transform cursor-pointer",
            !onChange && "cursor-default",
            star <= value ? "text-yellow-400" : "text-gray-300"
          )}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function ReviewsSection({ itemType, itemId, currentUserId }: ReviewsSectionProps) {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/reviews?itemType=${itemType}&itemId=${encodeURIComponent(itemId)}`
      );
      if (!response.ok) throw new Error("Failed to load reviews");
      const data = await response.json();
      setReviews(data.reviews);
      setStats(data.stats);
      const own = data.reviews.find((r: ReviewItem) => r.user.id === currentUserId);
      if (own) {
        setMyRating(own.rating);
        setMyComment(own.comment || "");
      }
    } catch {
      showToast("Could not load reviews", "error");
    } finally {
      setIsLoading(false);
    }
  }, [itemType, itemId, currentUserId, showToast]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);


  const submitReview = async () => {
    if (myRating === 0) {
      showToast("Please select a star rating", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, itemId, rating: myRating, comment: myComment || undefined }),
      });
      if (response.status === 401) {
        showToast("Please sign in to write a review", "error");
        return;
      }
      if (!response.ok) throw new Error("Failed to submit review");
      recordActivity("reviewsWritten");
      showToast("Review saved. Thank you!", "success");
      await loadReviews();
    } catch {
      showToast("Failed to save review", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteReview = async (id: string) => {
    try {
      const response = await fetch(`/api/reviews?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete review");
      showToast("Review removed", "success");
      setMyRating(0);
      setMyComment("");
      await loadReviews();
    } catch {
      showToast("Failed to delete review", "error");
    }
  };

  const hasOwnReview = reviews.some((r) => r.user.id === currentUserId);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">⭐ Reviews & Ratings</h3>
        {stats && stats.count > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(stats.averageRating)} size="sm" />
            <Badge variant="brand" size="md">
              {stats.averageRating} ({stats.count})
            </Badge>
          </div>
        )}
      </div>

      {/* Write a review */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-2">
          {hasOwnReview ? "Update your review" : "Share your experience"}
        </p>
        <StarRating value={myRating} onChange={setMyRating} size="lg" />
        <div className="mt-3">
          <Textarea
            placeholder="How was your trip? Any tips for other travellers? (optional)"
            rows={3}
            maxLength={1000}
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button onClick={submitReview} isLoading={isSubmitting} size="sm">
            {hasOwnReview ? "Update Review" : "Submit Review"}
          </Button>
          {!currentUserId && (
            <span className="text-xs text-gray-500">Sign in required to review</span>
          )}
        </div>
      </div>

      {/* Reviews list */}
      {isLoading ? (
        <Skeleton lines={4} />
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No reviews yet. Be the first to share your experience!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-bangladesh-green text-white flex items-center justify-center text-xs font-semibold shrink-0">
                    {review.user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {review.user.name}
                      {review.user.id === currentUserId && <Badge variant="info" className="ml-2">You</Badge>}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StarRating value={review.rating} size="sm" />
                  {review.user.id === currentUserId && (
                    <button
                      onClick={() => deleteReview(review.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                      aria-label="Delete my review"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-600 mt-2 ml-10">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

