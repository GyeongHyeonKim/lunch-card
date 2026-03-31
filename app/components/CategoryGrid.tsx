"use client";

import { motion } from "framer-motion";
import { CATEGORIES } from "../lib/categories";

interface CategoryGridProps {
  onSelect: (category: { emoji: string; label: string }) => void;
}

export default function CategoryGrid({ onSelect }: CategoryGridProps) {
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="grid grid-cols-3 gap-3">
        {CATEGORIES.map((cat) => (
          <motion.button
            key={cat.label}
            onClick={() => onSelect({ emoji: cat.emoji, label: cat.label })}
            className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--accent)] transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-3xl">{cat.emoji}</span>
            <span className="text-xs font-medium text-gray-300 text-center leading-tight">
              {cat.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
