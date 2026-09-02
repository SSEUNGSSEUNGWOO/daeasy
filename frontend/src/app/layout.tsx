import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  OFFICE_ADDRESS,
  SITE_URL,
} from "@/lib/site";

/**
 * 검색엔진이 브랜드를 하나의 조직으로 인식하게 하는 구조화 데이터.
 * "데이지", "AI 챔피언" 같은 브랜드·프로그램 질의에서 지식 패널·사이트링크의 근거가 된다.
 * sameAs 는 같은 주체임을 알리는 신호라 운영 중인 채널만 넣는다.
 */
const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "DAEASY(데이지)",
  alternateName: ["데이지", "DAEASY", "케이브레인컴퍼니"],
  url: SITE_URL,
  logo: `${SITE_URL}/logo/daeasy-symbol-mark.png`,
  description:
    "기업·공공기관 대상 AI·데이터 교육 전문 브랜드. 행정안전부 AI 챔피언 프로그램 공식 운영",
  email: CONTACT_EMAIL,
  telephone: CONTACT_PHONE,
  address: {
    "@type": "PostalAddress",
    streetAddress: OFFICE_ADDRESS,
    addressLocality: "서울",
    addressCountry: "KR",
  },
  sameAs: [
    "https://blog.naver.com/daeasy_official",
    "https://instagram.com/daeasy.official",
  ],
};

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
  // 도메인을 여러 개 붙이면(daeasy.co.kr / daeasy.kr / ai-champ.kr) 같은 페이지가
  // 여러 벌로 색인돼 검색 신호가 쪼개진다. 상대 경로 canonical 은 각 페이지에서
  // metadataBase + 자기 경로로 해석되므로, 어느 도메인으로 들어와도 정규 URL 하나를 가리킨다.
  alternates: { canonical: "./" },
  title: {
    // "AI 챔피언" 검색 유입은 /ai-champion 전용 타이틀이 담당 — 기본 타이틀은
    // 핵심 정체성(기업·공공기관 AI·데이터 교육)에 집중해 검색 결과 잘림을 피한다
    default: "기업·공공기관 AI·데이터 교육 | DAEASY(데이지)",
    template: "%s | DAEASY(데이지)",
  },
  description:
    "케이브레인컴퍼니가 만든 AI·데이터 교육 전문 브랜드 데이지입니다. 기업·공공기관 대상 실무 교육을 제공하며, 행정안전부 AI 챔피언 프로그램을 공식 운영합니다.",
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
        <Script id="organization-ld" type="application/ld+json">
          {JSON.stringify(ORGANIZATION_LD)}
        </Script>
        {/* JS 미실행 환경에선 reveal 계열의 opacity:0 게이트를 해제해 본문이 보이게 한다 */}
        <noscript>
          <style>{`.anim-page-fade-up,.anim-hero-fade,.anim-cover-scale-fade,.reveal,.reveal-stagger>*{opacity:1!important;transform:none!important;animation:none!important;transition:none!important;}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
