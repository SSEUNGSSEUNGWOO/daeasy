import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

import { SITE_URL } from "@/lib/site";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// 본문 한글 폰트. CDN <link> 대신 자체 호스팅해 렌더 블로킹 없이 preload 된다.
// 라이선스: SIL OFL 1.1 (fonts/LICENSE-Pretendard.txt)
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  // 카톡·슬랙 공유 미리보기(OG)가 절대 URL 을 만들 수 있게 한다
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DAEASY(데이지) — 행정안전부 AI 챔피언 운영·AI 데이터 교육",
    template: "%s | DAEASY(데이지)",
  },
  description:
    "케이브레인컴퍼니가 만든 AI·데이터 교육 전문 브랜드 데이지입니다. 행정안전부 공공부문 AI 챔피언 프로그램 운영과 기업·기관 대상 실무 교육을 제공합니다.",
  openGraph: {
    siteName: "DAEASY(데이지)",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-ink-warm">
        {/* JS 미실행 환경에선 reveal 계열의 opacity:0 게이트를 해제해 본문이 보이게 한다 */}
        <noscript>
          <style>{`.anim-page-fade-up,.anim-hero-fade,.anim-cover-scale-fade,.reveal,.reveal-stagger>*{opacity:1!important;transform:none!important;animation:none!important;transition:none!important;}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
