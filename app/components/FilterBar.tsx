"use client";

import { motion } from "framer-motion";

export interface Filters {
  distance: number;
  people: string;
  price: string;
}

const DISTANCES = [
  { value: 300, label: "300m" },
  { value: 500, label: "500m" },
  { value: 1000, label: "1km" },
  { value: 2000, label: "2km" },
];

const PEOPLE = [
  { value: "solo", label: "혼밥", emoji: "🧑" },
  { value: "small", label: "2-3명", emoji: "👥" },
  { value: "group", label: "단체", emoji: "👨‍👩‍👧‍👦" },
];

const PRICES = [
  { value: "cheap", label: "가성비", emoji: "💰" },
  { value: "mid", label: "보통", emoji: "💳" },
  { value: "nice", label: "좀 좋은 곳", emoji: "✨" },
];

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
        selected
          ? "bg-[var(--accent)] text-white"
          : "bg-white/5 text-gray-400 border border-[var(--card-border)]"
      }`}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto mb-6 flex flex-col gap-3"
    >
      {/* Distance */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-10 shrink-0">거리</span>
        <div className="flex gap-1.5 flex-wrap">
          {DISTANCES.map((d) => (
            <Chip
              key={d.value}
              selected={filters.distance === d.value}
              onClick={() => onChange({ ...filters, distance: d.value })}
            >
              {d.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* People */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-10 shrink-0">인원</span>
        <div className="flex gap-1.5 flex-wrap">
          {PEOPLE.map((p) => (
            <Chip
              key={p.value}
              selected={filters.people === p.value}
              onClick={() => onChange({ ...filters, people: p.value })}
            >
              {p.emoji} {p.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-10 shrink-0">가격</span>
        <div className="flex gap-1.5 flex-wrap">
          {PRICES.map((p) => (
            <Chip
              key={p.value}
              selected={filters.price === p.value}
              onClick={() => onChange({ ...filters, price: p.value })}
            >
              {p.emoji} {p.label}
            </Chip>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
