import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // canonical·sitemap 이 apex(daeasy.co.kr) 라 www 는 한 곳으로 모은다.
      // 둘 다 200 이면 같은 페이지가 두 벌로 색인돼 검색 신호가 갈린다
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.daeasy.co.kr" }],
        destination: "https://daeasy.co.kr/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
