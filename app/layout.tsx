import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "런치카드 🍱 오늘 점심 뭐 먹지?",
  description: "AI가 날씨, 위치, 시간을 읽고 오늘의 점심을 추천합니다. 룰렛 돌려서 결정!",
  openGraph: {
    title: "런치카드 🍱 오늘 점심 뭐 먹지?",
    description: "AI가 날씨, 위치, 시간을 읽고 오늘의 점심을 추천합니다.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
