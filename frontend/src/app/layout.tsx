import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

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
  title: {
    default: "DAEASY(데이지) — AI · 데이터 교육",
    template: "%s | DAEASY(데이지)",
  },
  description:
    "AI와 데이터를 업무에 쓰려는 모든 조직과 사람을 위한 교육. 교육과정 · 사례 · 가이드 · 뉴스레터.",
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
        {children}
      </body>
    </html>
  );
}
