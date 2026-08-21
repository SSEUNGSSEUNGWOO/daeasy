/**
 * 사이트 절대 URL. robots / sitemap / metadataBase 가 공유한다.
 * 커스텀 도메인을 붙이면 Vercel 환경변수 NEXT_PUBLIC_SITE_URL 만 바꾸면 된다.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://daeasy.vercel.app";

/**
 * 연락처 단일 출처. 예전엔 8개 파일에 하드코딩돼 있어 /support 만 다른 번호
 * (070-7606-7586) 를 안내하는 사고가 났다. 표기가 필요한 곳은 반드시 여기를 참조한다.
 */
export const CONTACT_EMAIL = "data-edu@kbrainc.com";
export const CONTACT_PHONE = "070-5066-0995";
export const OFFICE_HOURS = "평일 10:00 ~ 18:00";

/** 본사 */
export const OFFICE_ADDRESS = "서울시 동작구 보라매로5길 51 롯데타워 301~309호";
/** 공개교육장 · 대관 강의실 */
export const VENUE_ADDRESS = "서울시 마포구 성암로 189 중소기업DMC타워 701호";
