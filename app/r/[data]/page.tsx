import { Metadata } from "next";
import SharePageClient from "./client";

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

function decodeCardData(encoded: string): CardData | null {
  try {
    const decoded = Buffer.from(decodeURIComponent(encoded), "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ data: string }>;
}): Promise<Metadata> {
  const { data } = await params;
  const card = decodeCardData(data);

  if (!card) {
    return { title: "런치카드 🍱" };
  }

  const title = `${card.moodEmoji} ${card.restaurantName} - ${card.menu}`;
  const description = card.reason;

  return {
    title,
    description,
    openGraph: {
      title: `런치카드 | ${title}`,
      description,
      images: [
        {
          url: `/api/og?data=${data}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `런치카드 | ${title}`,
      description,
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ data: string }>;
}) {
  const { data } = await params;
  const card = decodeCardData(data);

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">카드를 찾을 수 없습니다</p>
      </div>
    );
  }

  return <SharePageClient card={card} />;
}
