/**
 * 사이트 절대 URL. robots / sitemap / metadataBase 가 공유한다.
 * 커스텀 도메인을 붙이면 Vercel 환경변수 NEXT_PUBLIC_SITE_URL 만 바꾸면 된다.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://daeasy.vercel.app";
