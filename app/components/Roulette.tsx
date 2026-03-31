"use client";

import { motion, useAnimation } from "framer-motion";
import { useState, useCallback } from "react";
import { CATEGORIES } from "../lib/categories";

interface RouletteProps {
  onResult: (category: { emoji: string; label: string }) => void;
  isSpinning: boolean;
  onSpin: () => void;
  result: { emoji: string; label: string } | null;
}

export default function Roulette({ onResult, isSpinning, onSpin, result }: RouletteProps) {
  const controls = useAnimation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const ITEM_HEIGHT = 80;
  const VISIBLE_ITEMS = 5;

  const spin = useCallback(async () => {
    if (isSpinning) return;
    onSpin();

    const targetIndex = Math.floor(Math.random() * CATEGORIES.length);
    const totalSpins = 3;
    const totalItems = totalSpins * CATEGORIES.length + targetIndex;
    const centerOffset = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);

    await controls.start({
      y: -(totalItems * ITEM_HEIGHT) + centerOffset,
      transition: {
        duration: 3,
        ease: [0.15, 0.85, 0.35, 1.0],
      },
    });

    setCurrentIndex(targetIndex);
    onResult(CATEGORIES[targetIndex]);
  }, [isSpinning, controls, onResult, onSpin]);

  // Build repeated items for smooth spinning
  const repeatedItems = [];
  for (let i = 0; i < CATEGORIES.length * 5; i++) {
    repeatedItems.push(CATEGORIES[i % CATEGORIES.length]);
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Slot machine container */}
      <div className="relative w-72 overflow-hidden rounded-2xl border-2 border-[var(--card-border)] bg-[var(--card-bg)]"
           style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
        {/* Center indicator */}
        <div className="absolute top-1/2 left-0 right-0 z-10 -translate-y-1/2 pointer-events-none"
             style={{ height: ITEM_HEIGHT }}>
          <div className="h-full border-y-2 border-[var(--accent)] bg-[var(--accent-glow)]" />
        </div>

        {/* Gradient masks */}
        <div className="absolute top-0 left-0 right-0 h-20 z-10 bg-gradient-to-b from-[var(--card-bg)] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-20 z-10 bg-gradient-to-t from-[var(--card-bg)] to-transparent pointer-events-none" />

        {/* Spinning strip */}
        <motion.div
          animate={controls}
          style={{ y: -(currentIndex * ITEM_HEIGHT) + (ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2)) }}
        >
          {repeatedItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6"
              style={{ height: ITEM_HEIGHT }}
            >
              <span className="text-4xl">{item.emoji}</span>
              <span className="text-xl font-semibold">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Spin button */}
      {!result && (
        <motion.button
          onClick={spin}
          disabled={isSpinning}
          className="relative px-12 py-4 text-xl font-bold rounded-full text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSpinning ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                🎰
              </motion.span>
              추천 중...
            </span>
          ) : (
            "🎲 오늘의 점심 돌리기!"
          )}
        </motion.button>
      )}
    </div>
  );
}
