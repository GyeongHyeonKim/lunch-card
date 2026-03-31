import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const LunchPickSchema = z.object({
  restaurantName: z.string().describe("음식점 이름 (리스트에 있는 것만)"),
  menu: z.string().describe("추천 메뉴 (한 가지)"),
  reason: z.string().describe("추천 이유 (1문장, 친근한 말투)"),
  moodEmoji: z.string().describe("분위기를 나타내는 이모지 하나"),
});

const LunchResultSchema = z.object({
  moodTag: z.string().describe("오늘의 무드 태그 (예: 따뜻한 날, 매운 날, 가벼운 점심)"),
  picks: z.array(LunchPickSchema).describe("정확히 3개의 음식점 추천"),
});

const FallbackResultSchema = z.object({
  moodTag: z.string().describe("오늘의 무드 태그"),
  picks: z.array(z.object({
    restaurantName: z.string().describe("실제 있을 법한 음식점 이름"),
    menu: z.string().describe("추천 메뉴 (한 가지)"),
    reason: z.string().describe("추천 이유 (1문장, 친근한 말투)"),
    moodEmoji: z.string().describe("분위기를 나타내는 이모지 하나"),
  })).describe("정확히 3개의 음식점 추천"),
});

interface KakaoPlace {
  place_name: string;
  category_name: string;
  distance: string;
  road_address_name: string;
  address_name: string;
  place_url: string;
  imageUrl?: string;
}

// Levenshtein distance for fuzzy restaurant name matching
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function findBestMatch(name: string, candidates: KakaoPlace[]): KakaoPlace | undefined {
  // 1. Exact match
  const exact = candidates.find((r) => r.place_name === name);
  if (exact) return exact;

  // 2. Substring match (one contains the other)
  const substring = candidates.find(
    (r) => r.place_name.includes(name) || name.includes(r.place_name)
  );
  if (substring) return substring;

  // 3. Levenshtein distance (threshold: 40% of shorter string length)
  let best: KakaoPlace | undefined;
  let bestDist = Infinity;
  for (const r of candidates) {
    const dist = levenshtein(r.place_name, name);
    const threshold = Math.ceil(Math.min(r.place_name.length, name.length) * 0.4);
    if (dist < bestDist && dist <= threshold) {
      best = r;
      bestDist = dist;
    }
  }
  return best;
}

const ALLOWED_OG_DOMAINS = ["place.map.kakao.com", "map.kakao.com"];

async function fetchOgImage(placeUrl: string): Promise<string | undefined> {
  try {
    // Validate URL domain to prevent SSRF
    const parsed = new URL(placeUrl);
    if (!ALLOWED_OG_DOMAINS.some((d) => parsed.hostname.endsWith(d))) return undefined;

    const res = await fetch(placeUrl, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return undefined;
    const html = await res.text();
    const match = html.match(/og:image.*?content="([^"]+)"/);
    if (!match) return undefined;
    let url = match[1];
    if (url.startsWith("//")) url = "https:" + url;
    // Skip static map fallback images (no real photo)
    if (url.includes("staticmap.kakao.com")) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

async function enrichWithImages(places: KakaoPlace[]): Promise<KakaoPlace[]> {
  const results = await Promise.allSettled(
    places.map(async (p) => {
      const imageUrl = await fetchOgImage(p.place_url);
      return { ...p, imageUrl };
    })
  );
  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : places[i]
  );
}

// Map category labels to Kakao-searchable keywords
const CATEGORY_SEARCH_KEYWORDS: Record<string, string> = {
  "따뜻한 국물": "국밥",
  "가벼운 샐러드": "샐러드",
  "면 요리": "라멘",
  "한정식/백반": "한정식",
  "카레/덮밥": "카레",
  "피자/버거": "피자",
};

async function fetchNearbyRestaurants(lat: number, lng: number, radius: number = 500, keyword?: string): Promise<KakaoPlace[]> {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) return [];

  // Map category labels to better search keywords for Kakao
  const searchKeyword = keyword ? (CATEGORY_SEARCH_KEYWORDS[keyword] || keyword) : null;
  const query = searchKeyword ? encodeURIComponent(searchKeyword) : null;
  const url = query
    ? `https://dapi.kakao.com/v2/local/search/keyword.json?query=${query}&x=${lng}&y=${lat}&radius=${radius}&sort=distance&size=15`
    : `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=FD6&x=${lng}&y=${lat}&radius=${radius}&sort=distance&size=15`;

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.documents || [];
}

async function fetchWeather(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=Asia/Seoul`
    );
    if (!res.ok) return null;
    const data = await res.json();
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

    return { temp, description, icon };
  } catch {
    return null;
  }
}

function getTimeContext() {
  const hour = new Date().getHours();
  if (hour < 11) return "이른 점심 (11시 전)";
  if (hour < 12) return "점심시간 시작";
  if (hour < 13) return "점심시간 피크";
  if (hour < 14) return "늦은 점심";
  return "점심시간 지남";
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, category, radius = 500, people = "small", price = "mid", exclude = [] } = await req.json();
    const excludeSet = new Set((exclude as string[]).map((n) => n.toLowerCase()));

    const peopleLabel: Record<string, string> = {
      solo: "혼밥 (1인)",
      small: "소규모 (2-3명)",
      group: "단체 (4명 이상)",
    };
    const priceLabel: Record<string, string> = {
      cheap: "가성비 좋은 곳 (1만원 이하)",
      mid: "보통 (1-2만원)",
      nice: "좀 좋은 곳 (2만원 이상)",
    };

    console.log(`[recommend] lat=${lat}, lng=${lng}, category=${category}, radius=${radius}`);

    const [restaurants, weather] = await Promise.all([
      fetchNearbyRestaurants(lat, lng, radius, category),
      fetchWeather(lat, lng),
    ]);

    console.log(`[recommend] initial results: ${restaurants.length}, names: ${restaurants.slice(0, 3).map(r => `${r.place_name}(${r.distance}m)`).join(', ')}`);

    // Filter out previously seen restaurants
    let filtered = restaurants.filter((r) => !excludeSet.has(r.place_name.toLowerCase()));
    if (filtered.length < 3) {
      const expandedRadius = Math.min(radius * 2, 3000);
      console.log(`[recommend] expanding radius to ${expandedRadius}m (only ${filtered.length} results)`);
      const expanded = await fetchNearbyRestaurants(lat, lng, expandedRadius, category);
      filtered = expanded.filter((r) => !excludeSet.has(r.place_name.toLowerCase()));
    }
    const finalRestaurants = await enrichWithImages(filtered);
    console.log(`[recommend] final results: ${finalRestaurants.length}, names: ${finalRestaurants.slice(0, 5).map(r => `${r.place_name}(${r.distance}m, ${r.road_address_name})`).join(', ')}`);

    const timeContext = getTimeContext();
    const weatherContext = weather
      ? `현재 기온 ${weather.temp}도, ${weather.description}`
      : "날씨 정보 없음";

    // Fallback: no restaurants from Kakao
    if (finalRestaurants.length === 0) {
      let fallbackObject;
      try {
        const result = await generateObject({
          model: anthropic("claude-haiku-4-5-20251001"),
          schema: FallbackResultSchema,
          prompt: `당신은 점심 메뉴 추천 전문가입니다.
현재 상황:
- 시간: ${timeContext}
- 날씨: ${weatherContext}
- 카테고리: ${category}
- 인원: ${peopleLabel[people] || people}
- 가격대: ${priceLabel[price] || price}

이 조건에 맞는 음식점 3곳과 각각의 대표 메뉴를 추천해주세요.
각 추천은 서로 다른 스타일이어야 합니다. 인원과 가격대를 고려해주세요.
친근하고 재미있는 말투로 추천 이유를 1문장으로 작성해주세요.`,
        });
        fallbackObject = result.object;
      } catch (aiError) {
        console.error("[recommend] AI fallback error:", aiError instanceof Error ? aiError.message : aiError);
        return NextResponse.json(
          { error: "AI 추천 서비스에 일시적 문제가 발생했습니다. 잠시 후 다시 시도해주세요." },
          { status: 503 }
        );
      }

      return NextResponse.json({
        moodTag: fallbackObject.moodTag,
        picks: fallbackObject.picks.map((p) => ({
          ...p,
          distance: "근처",
          address: "주변 맛집",
        })),
        category,
        weather,
      });
    }

    const restaurantList = finalRestaurants
      .map((r, i) => `${i + 1}. ${r.place_name} (${r.category_name}) - ${r.distance}m, ${r.road_address_name || r.address_name}`)
      .join("\n");

    let object;
    try {
      const result = await generateObject({
        model: anthropic("claude-haiku-4-5-20251001"),
        schema: LunchResultSchema,
        prompt: `당신은 점심 메뉴 추천 전문가입니다.
현재 상황:
- 시간: ${timeContext}
- 날씨: ${weatherContext}
- 카테고리: ${category}
- 인원: ${peopleLabel[people] || people}
- 가격대: ${priceLabel[price] || price}

아래 실제 주변 음식점 리스트에서 3곳을 골라 추천해주세요:
${restaurantList}

반드시 위 리스트에 있는 음식점만 추천하세요.
인원과 가격대를 고려해서 적합한 곳을 골라주세요.
각 추천은 서로 다른 매력이 있어야 합니다.
친근하고 재미있는 말투로 추천 이유를 1문장으로 작성해주세요.`,
      });
      object = result.object;
    } catch (aiError) {
      console.error("[recommend] AI error:", aiError instanceof Error ? aiError.message : aiError);
      return NextResponse.json(
        { error: "AI 추천 서비스에 일시적 문제가 발생했습니다. 잠시 후 다시 시도해주세요." },
        { status: 503 }
      );
    }

    const picks = object.picks.map((pick) => {
      const matched = findBestMatch(pick.restaurantName, finalRestaurants);
      if (!matched) {
        console.log(`[recommend] WARNING: no match for "${pick.restaurantName}", available: ${finalRestaurants.map(r => r.place_name).join(', ')}`);
      }

      return {
        ...pick,
        restaurantName: matched?.place_name || pick.restaurantName,
        distance: matched ? `${matched.distance}m` : "근처",
        address: matched?.road_address_name || matched?.address_name || "",
        placeUrl: matched?.place_url,
        imageUrl: matched?.imageUrl,
      };
    });

    return NextResponse.json({
      moodTag: object.moodTag,
      picks,
      category,
      weather,
    });
  } catch (error) {
    console.error("Recommendation error:", error instanceof Error ? error.message : error);
    console.error("Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2));
    return NextResponse.json(
      { error: "추천 생성에 실패했습니다", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
