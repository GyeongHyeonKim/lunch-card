"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface CardData {
  restaurantName: string;
  menu: string;
  reason: string;
  moodEmoji: string;
  moodTag: string;
  distance: string;
  address: string;
  category: string;
  weather?: { temp: number; description: string };
}

export default function SharePageClient({ card }: { card: CardData }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-3xl overflow-hidden border border-[var(--card-border)] bg-gradient-to-br from-[#1a1a2e] to-[#16213e] shadow-2xl">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">오늘의 런치카드</span>
              {card.weather && (
                <span className="text-sm text-gray-400">
                  {card.weather.temp}° {card.weather.description}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-3xl">{card.moodEmoji}</span>
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-[var(--accent)] bg-opacity-20 text-[var(--accent)]">
                {card.moodTag}
              </span>
            </div>
          </div>

          <div className="px-6 pb-4">
            <h2 className="text-2xl font-bold mb-1">{card.restaurantName}</h2>
            <p className="text-lg text-[var(--accent)] font-semibold mb-2">{card.menu}</p>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">{card.reason}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>📍 {card.distance}</span>
              <span>{card.address}</span>
            </div>
          </div>

          <div className="mx-6 border-t border-[var(--card-border)]" />

          <div className="px-6 py-4">
            <Link href="/">
              <motion.button
                className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                style={{ background: "var(--accent)" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🎲 나도 돌려보기!
              </motion.button>
            </Link>
          </div>
        </div>
        <p className="text-center text-xs text-gray-600 mt-4">
          런치카드 lunchcard.vercel.app
        </p>
      </motion.div>
    </div>
  );
}
