import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img1.kakaocdn.net" },
      { protocol: "http", hostname: "img1.kakaocdn.net" },
      { protocol: "https", hostname: "t1.daumcdn.net" },
      { protocol: "http", hostname: "t1.daumcdn.net" },
      { protocol: "https", hostname: "postfiles.pstatic.net" },
    ],
  },
};

export default nextConfig;
