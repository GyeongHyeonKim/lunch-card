"use client";

import { useState, useEffect } from "react";

interface Review {
  rating: number;
  text: string;
  date: string;
  name: string;
}

interface ReviewSectionProps {
  restaurantName: string;
  placeUrl?: string;
}

function getReviewKey(name: string, placeUrl?: string): string {
  return placeUrl || name;
}

function loadReviews(): Record<string, Review> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("lunchcard-reviews");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveReview(key: string, review: Review) {
  const reviews = loadReviews();
  reviews[key] = review;
  localStorage.setItem("lunchcard-reviews", JSON.stringify(reviews));
}

export default function ReviewSection({ restaurantName, placeUrl }: ReviewSectionProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [existing, setExisting] = useState<Review | null>(null);

  const key = getReviewKey(restaurantName, placeUrl);

  useEffect(() => {
    const reviews = loadReviews();
    const review = reviews[key];
    if (review) {
      setExisting(review);
      setRating(review.rating);
      setText(review.text);
    } else {
      setExisting(null);
      setRating(0);
      setText("");
    }
    setSaved(false);
  }, [key]);

  const handleSubmit = () => {
    if (rating === 0) return;
    const review: Review = {
      rating,
      text: text.trim(),
      date: new Date().toISOString().split("T")[0],
      name: restaurantName,
    };
    saveReview(key, review);
    setExisting(review);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mt-3 px-1">
      {existing && !saved && (
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
          <span>
            {"⭐".repeat(existing.rating)}{"☆".repeat(5 - existing.rating)}
          </span>
          {existing.text && (
            <span className="truncate">&quot;{existing.text}&quot;</span>
          )}
        </div>
      )}

      {saved && (
        <div className="text-sm text-green-400 mb-2">
          리뷰가 저장되었습니다!
        </div>
      )}

      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`text-lg transition-colors ${
              star <= rating ? "text-yellow-400" : "text-gray-600"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="한줄 후기 (선택)"
          maxLength={50}
          className="flex-1 px-3 py-2 text-sm rounded-xl bg-white/5 border border-[var(--card-border)] text-white placeholder-gray-500 outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={handleSubmit}
          disabled={rating === 0}
          className="px-4 py-2 text-sm font-medium rounded-xl text-white disabled:opacity-30 transition-colors"
          style={{ background: rating > 0 ? "var(--accent)" : undefined }}
        >
          {existing ? "수정" : "등록"}
        </button>
      </div>
    </div>
  );
}
