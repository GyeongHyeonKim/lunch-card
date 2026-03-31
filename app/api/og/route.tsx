import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const encoded = searchParams.get("data");

  let card = {
    restaurantName: "런치카드",
    menu: "오늘의 점심",
    moodEmoji: "🍱",
    moodTag: "맛있는 날",
    reason: "AI가 추천하는 오늘의 점심",
  };

  if (encoded) {
    try {
      const decoded = atob(decodeURIComponent(encoded));
      card = { ...card, ...JSON.parse(decoded) };
    } catch {
      // Use defaults
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "48px 64px",
            borderRadius: "32px",
            border: "2px solid #2a2a4a",
            background: "linear-gradient(135deg, #1a1a2e, #16213e)",
            maxWidth: "900px",
          }}
        >
          {/* Mood */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <span style={{ fontSize: "64px" }}>{card.moodEmoji}</span>
            <span
              style={{
                fontSize: "24px",
                color: "#ff6b35",
                padding: "8px 24px",
                borderRadius: "999px",
                background: "rgba(255, 107, 53, 0.15)",
              }}
            >
              {card.moodTag}
            </span>
          </div>

          {/* Restaurant */}
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#fafafa",
              marginBottom: "8px",
              textAlign: "center",
            }}
          >
            {card.restaurantName}
          </h1>

          {/* Menu */}
          <p
            style={{
              fontSize: "32px",
              color: "#ff6b35",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            {card.menu}
          </p>

          {/* Reason */}
          <p
            style={{
              fontSize: "20px",
              color: "#a0a0b0",
              textAlign: "center",
              lineHeight: "1.5",
              maxWidth: "700px",
            }}
          >
            {card.reason}
          </p>
        </div>

        {/* Watermark */}
        <p
          style={{
            position: "absolute",
            bottom: "24px",
            fontSize: "16px",
            color: "#404060",
          }}
        >
          런치카드 🍱 lunchcard.vercel.app
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
