"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Roulette from "./components/Roulette";
import CategoryGrid from "./components/CategoryGrid";
import LunchCard, { LunchResult, LunchPick } from "./components/LunchCard";
import ContextBar from "./components/ContextBar";
import FilterBar, { Filters } from "./components/FilterBar";

type Phase = "intro" | "spinning" | "loading" | "result";

interface Weather {
  temp: number;
  description: string;
  icon: string;
}

interface Location {
  lat: number;
  lng: number;
  label: string;
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [result, setResult] = useState<LunchResult | null>(null);
  const [rouletteResult, setRouletteResult] = useState<{ emoji: string; label: string } | null>(null);
  const [filters, setFilters] = useState<Filters>({ distance: 500, people: "small", price: "mid" });
  const [seenNames, setSeenNames] = useState<string[]>([]);
  const [tab, setTab] = useState<"roulette" | "category">("roulette");

  // Get current time string
  const getTimeString = () => {
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes().toString().padStart(2, "0");
    return `${hour}:${min}`;
  };

  // Fetch location and weather on mount
  useEffect(() => {
    async function init() {
      try {
        // Get location
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 300000,
          });
        });

        const { latitude: lat, longitude: lng } = pos.coords;

        // Reverse geocode with Kakao (or use fallback label)
        let label = "현재 위치";
        try {
          const geoRes = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            label = geoData.label || label;
          }
        } catch {
          // Fallback label is fine
        }

        setLocation({ lat, lng, label });

        // Fetch weather
        try {
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=Asia/Seoul`
          );
          if (weatherRes.ok) {
            const data = await weatherRes.json();
            const temp = Math.round(data.current.temperature_2m);
            const code = data.current.weather_code;
            let description = "맑음";
            let icon = "☀️";
            if (code >= 1 && code <= 3) { description = "구름 약간"; icon = "⛅"; }
            if (code >= 45 && code <= 48) { description = "안개"; icon = "🌫️"; }
            if (code >= 51 && code <= 67) { description = "비"; icon = "🌧️"; }
            if (code >= 71 && code <= 77) { description = "눈"; icon = "🌨️"; }
            if (code >= 80 && code <= 82) { description = "소나기"; icon = "🌦️"; }
            if (code >= 95) { description = "뇌우"; icon = "⛈️"; }
            setWeather({ temp, description, icon });
          }
        } catch {
          // Weather unavailable
        }
      } catch {
        // Geolocation denied or unavailable — use fallback with clear label
        setLocation({ lat: 37.5665, lng: 126.978, label: "서울 시청 (위치 권한 필요)" });
      } finally {
        setContextLoading(false);
      }
    }

    init();
  }, []);

  const handleSpin = useCallback(() => {
    setPhase("spinning");
    setResult(null);
    setRouletteResult(null);
  }, []);

  const handleRouletteResult = useCallback(
    async (category: { emoji: string; label: string }) => {
      setRouletteResult(category);
      setPhase("loading");

      try {
        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: location?.lat || 37.5665,
            lng: location?.lng || 126.978,
            category: category.label,
            radius: filters.distance,
            people: filters.people,
            price: filters.price,
            exclude: seenNames,
          }),
        });

        if (!res.ok) throw new Error("Failed");

        const data = await res.json();
        const newNames = (data.picks || []).map((p: LunchPick) => p.restaurantName);
        setSeenNames((prev) => [...prev, ...newNames]);
        setResult({
          moodTag: data.moodTag,
          picks: data.picks,
          category: category.label,
        });
        if (data.weather) {
          setWeather({
            temp: data.weather.temp,
            description: data.weather.description,
            icon: data.weather.icon || "☀️",
          });
        }
        setPhase("result");
      } catch {
        setResult({
          moodTag: category.label,
          picks: [{
            restaurantName: `${category.emoji} ${category.label}`,
            menu: "오늘은 이거다!",
            reason: "AI 연결이 안 되지만 룰렛은 거짓말하지 않아요!",
            moodEmoji: category.emoji,
            distance: "근처",
            address: "주변 맛집에서",
          }],
          category: category.label,
        });
        setPhase("result");
      }
    },
    [location, filters, seenNames]
  );

  const handleCategorySelect = useCallback(
    (category: { emoji: string; label: string }) => {
      setResult(null);
      setRouletteResult(null);
      handleRouletteResult(category);
    },
    [handleRouletteResult]
  );

  const handleShare = useCallback((pick: LunchPick) => {
    if (!result) return;

    const cardData = {
      restaurantName: pick.restaurantName,
      menu: pick.menu,
      reason: pick.reason,
      moodEmoji: pick.moodEmoji,
      moodTag: result.moodTag,
      distance: pick.distance,
      address: pick.address,
      category: result.category,
      weather: weather ? { temp: weather.temp, description: weather.description } : undefined,
    };

    const encoded = btoa(
      encodeURIComponent(JSON.stringify(cardData))
        .replace(/%([0-9A-F]{2})/g, (_, p1) =>
          String.fromCharCode(parseInt(p1, 16))
        )
    );

    const shareUrl = `${window.location.origin}/r/${encoded}`;

    if (navigator.share) {
      navigator.share({
        title: `${pick.moodEmoji} ${pick.restaurantName} - ${pick.menu}`,
        text: pick.reason,
        url: shareUrl,
      }).catch(() => {
        navigator.clipboard.writeText(shareUrl);
        alert("링크가 복사되었습니다! 📋");
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("링크가 복사되었습니다! 📋");
    }
  }, [result, weather]);

  const handleReshuffle = useCallback(() => {
    if (!rouletteResult) return;
    handleRouletteResult(rouletteResult);
  }, [rouletteResult, handleRouletteResult]);

  const handleRetry = useCallback(() => {
    setPhase("intro");
    setResult(null);
    setRouletteResult(null);
    setSeenNames([]);
    setTab("roulette");
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-4xl font-bold mb-2">🍱 런치카드</h1>
        <p className="text-gray-400">오늘 점심, 고민은 그만. 돌려서 결정!</p>
      </motion.div>

      {/* Context bar */}
      <ContextBar
        weather={weather}
        location={location?.label || null}
        time={getTimeString()}
        loading={contextLoading}
      />

      {/* Tab bar + Filters — only show on intro */}
      {phase === "intro" && (
        <>
          <div className="flex gap-1 mb-4 p-1 rounded-xl bg-white/5 border border-[var(--card-border)]">
            <button
              onClick={() => setTab("roulette")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                tab === "roulette"
                  ? "bg-[var(--accent)] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🎰 룰렛
            </button>
            <button
              onClick={() => setTab("category")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                tab === "category"
                  ? "bg-[var(--accent)] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              📋 카테고리
            </button>
          </div>
          <FilterBar filters={filters} onChange={setFilters} />
        </>
      )}

      {/* Main content */}
      <AnimatePresence mode="wait">
        {(phase === "intro" || phase === "spinning") && tab === "roulette" && (
          <motion.div
            key="roulette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Roulette
              onResult={handleRouletteResult}
              isSpinning={phase === "spinning"}
              onSpin={handleSpin}
              result={rouletteResult}
            />
          </motion.div>
        )}

        {phase === "intro" && tab === "category" && (
          <motion.div
            key="category"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <CategoryGrid onSelect={handleCategorySelect} />
          </motion.div>
        )}

        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="text-5xl"
            >
              🍱
            </motion.div>
            <p className="text-gray-400">
              {rouletteResult?.emoji} <strong>{rouletteResult?.label}</strong> 맛집을 찾고 있어요...
            </p>
          </motion.div>
        )}

        {phase === "result" && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <LunchCard
              result={result}
              weather={weather ? { temp: weather.temp, description: weather.description } : undefined}
              onShare={handleShare}
              onReshuffle={handleReshuffle}
              onRetry={handleRetry}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
