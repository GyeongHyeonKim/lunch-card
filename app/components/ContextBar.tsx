"use client";

import { motion } from "framer-motion";

interface ContextBarProps {
  weather: { temp: number; description: string; icon: string } | null;
  location: string | null;
  time: string;
  loading: boolean;
}

export default function ContextBar({ weather, location, time, loading }: ContextBarProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-3 px-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] mb-8">
        <div className="shimmer h-4 w-48 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center justify-center gap-3 py-3 px-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] mb-8 text-sm text-gray-400"
    >
      {weather && (
        <span>{weather.icon} {weather.temp}° {weather.description}</span>
      )}
      {location && (
        <>
          <span className="text-gray-600">·</span>
          <span>📍 {location}</span>
        </>
      )}
      <span className="text-gray-600">·</span>
      <span>🕐 {time}</span>
    </motion.div>
  );
}
