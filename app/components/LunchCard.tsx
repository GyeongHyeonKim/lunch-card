"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import ReviewSection from "./ReviewSection";

export interface LunchPick {
  restaurantName: string;
  menu: string;
  reason: string;
  moodEmoji: string;
  distance: string;
  address: string;
  placeUrl?: string;
  imageUrl?: string;
}

export interface LunchResult {
  moodTag: string;
  picks: LunchPick[];
  category: string;
}

interface LunchCardProps {
  result: LunchResult;
  weather?: { temp: number; description: string };
  onShare: (pick: LunchPick) => void;
  onReshuffle: () => void;
  onRetry: () => void;
}

const SWIPE_THRESHOLD = 50;

// Category-based gradient fallbacks when no photo available
const CATEGORY_GRADIENTS: Record<string, string> = {
  "따뜻한 국물": "from-orange-900/80 to-red-900/80",
  "고기": "from-red-900/80 to-amber-900/80",
  "일식": "from-slate-800/80 to-blue-900/80",
  "양식": "from-emerald-900/80 to-teal-900/80",
  "가벼운 샐러드": "from-green-800/80 to-lime-900/80",
  "카레/덮밥": "from-yellow-900/80 to-orange-900/80",
  "면 요리": "from-amber-800/80 to-yellow-900/80",
  "분식": "from-rose-900/80 to-pink-900/80",
  "한정식/백반": "from-stone-800/80 to-warmGray-900/80",
  "피자/버거": "from-red-800/80 to-orange-900/80",
  "중식": "from-red-900/80 to-rose-900/80",
  "샌드위치": "from-lime-900/80 to-green-900/80",
};

function getGradient(category?: string): string {
  if (!category) return "from-slate-800/80 to-gray-900/80";
  for (const [key, val] of Object.entries(CATEGORY_GRADIENTS)) {
    if (category.includes(key)) return val;
  }
  return "from-slate-800/80 to-gray-900/80";
}

export default function LunchCard({ result, weather, onShare, onReshuffle, onRetry }: LunchCardProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const constraintsRef = useRef(null);

  const pick = result.picks[current];
  if (!pick) return null;

  const hasImage = pick.imageUrl && !imgErrors.has(current);

  const goTo = (index: number, dir: number) => {
    if (index < 0 || index >= result.picks.length) return;
    setDirection(dir);
    setCurrent(index);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD && current < result.picks.length - 1) {
      goTo(current + 1, 1);
    } else if (info.offset.x > SWIPE_THRESHOLD && current > 0) {
      goTo(current - 1, -1);
    }
  };

  const handleImgError = () => {
    setImgErrors((prev) => new Set(prev).add(current));
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0, scale: 0.9 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0, scale: 0.9 }),
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      transition={{ type: "spring", damping: 15, stiffness: 100 }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="inline-block text-sm font-medium px-3 py-1 rounded-full bg-white/10 text-white">
          {result.picks[0]?.moodEmoji} {result.moodTag}
        </span>
        {weather && (
          <span className="text-sm text-gray-400">
            {weather.temp}° {weather.description}
          </span>
        )}
      </div>

      {/* Carousel */}
      <div ref={constraintsRef} className="relative overflow-hidden rounded-3xl" style={{ touchAction: "pan-y" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="relative rounded-3xl overflow-hidden border border-[var(--card-border)] bg-gradient-to-br from-[#1a1a2e] to-[#16213e] shadow-2xl cursor-grab active:cursor-grabbing"
          >
            {/* Photo area */}
            <div className="relative h-56 overflow-hidden">
              {hasImage ? (
                <>
                  {/* Gradient background shown while image loads */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(result.category)} flex items-center justify-center`}>
                    <span className="text-5xl opacity-30">{pick.moodEmoji}</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pick.imageUrl}
                    alt={pick.restaurantName}
                    className="relative w-full h-full object-cover"
                    onError={handleImgError}
                  />
                </>
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${getGradient(result.category)} flex items-center justify-center`}>
                  <span className="text-7xl">{pick.moodEmoji}</span>
                </div>
              )}
              {/* Dark gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e]/40 to-transparent" />

              {/* Restaurant name overlay on photo */}
              <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{pick.moodEmoji}</span>
                  <h3 className="text-xl font-bold text-white truncate">{pick.restaurantName}</h3>
                </div>
                <p className="text-base font-semibold text-[var(--accent)]">{pick.menu}</p>
              </div>
            </div>

            {/* Info area */}
            <div className="px-5 pt-3 pb-4">
              <p className="text-sm text-gray-300 leading-relaxed">{pick.reason}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                <span>📍 {pick.distance}</span>
                <span className="truncate">{pick.address}</span>
              </div>

              {pick.placeUrl && (
                <a
                  href={pick.placeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onPointerDownCapture={(e) => e.stopPropagation()}
                  className="mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-[var(--card-border)] text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  🗺️ 지도 · 리뷰 · 메뉴 보기
                </a>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicator */}
      <div className="flex justify-center gap-2 mt-3">
        {result.picks.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > current ? 1 : -1)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === current
                ? "bg-[var(--accent)] w-6"
                : "bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* Review */}
      <ReviewSection
        restaurantName={pick.restaurantName}
        placeUrl={pick.placeUrl}
      />

      {/* Actions */}
      <div className="mt-4 flex flex-col gap-2">
        <motion.button
          onClick={() => onShare(pick)}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm"
          style={{ background: "var(--accent)" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          📤 여기로 결정!
        </motion.button>
        <div className="flex gap-2">
          <motion.button
            onClick={onReshuffle}
            className="flex-1 py-2.5 rounded-xl font-medium text-gray-400 text-xs border border-[var(--card-border)]"
            whileHover={{ scale: 1.02, borderColor: "var(--accent)" }}
            whileTap={{ scale: 0.98 }}
          >
            🎰 다시 뽑기
          </motion.button>
          <motion.button
            onClick={onRetry}
            className="flex-1 py-2.5 rounded-xl font-medium text-gray-400 text-xs border border-[var(--card-border)]"
            whileHover={{ scale: 1.02, borderColor: "var(--accent)" }}
            whileTap={{ scale: 0.98 }}
          >
            🎲 룰렛으로
          </motion.button>
        </div>
      </div>

      <p className="text-center text-xs text-gray-600 mt-4">
        런치카드 lunchcard.vercel.app
      </p>
    </motion.div>
  );
}
