/** 페이지별 구조화 데이터(JSON-LD).
 *
 *  next/script(afterInteractive)는 클라이언트에서 주입돼 서버 HTML 에 없다 —
 *  네이버 등 JS 미렌더 크롤러가 못 본다. 그래서 서버 렌더되는 일반 <script> 를
 *  쓴다 (Next.js 공식 문서의 JSON-LD 권장 패턴).
 *
 *  XSS 안전성: 입력은 항상 JSON.stringify 결과이고, DB 콘텐츠가 "</script>" 로
 *  스크립트를 탈출하지 못하도록 "<" 를 < 로 이스케이프한다. HTML 로
 *  해석되는 값이 아니므로 sanitizer 대상이 아니다.
 */
export function JsonLd({ id, data }: { id: string; data: object }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
