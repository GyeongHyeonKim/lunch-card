import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ label: "현재 위치" });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ label: "현재 위치" });
  }

  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`,
      { headers: { Authorization: `KakaoAK ${apiKey}` } }
    );

    if (!res.ok) {
      return NextResponse.json({ label: "현재 위치" });
    }

    const data = await res.json();
    const region = data.documents?.[0];

    if (region) {
      const label = [region.region_2depth_name, region.region_3depth_name]
        .filter(Boolean)
        .join(" ");
      return NextResponse.json({ label: label || "현재 위치" });
    }

    return NextResponse.json({ label: "현재 위치" });
  } catch {
    return NextResponse.json({ label: "현재 위치" });
  }
}
