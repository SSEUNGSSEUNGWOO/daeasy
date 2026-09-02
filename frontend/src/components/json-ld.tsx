import Script from "next/script";

/** 페이지별 구조화 데이터(JSON-LD) 삽입 — 레이아웃의 organization-ld 와 같은 패턴.
 *  `<` 이스케이프는 DB 콘텐츠가 </script> 로 스크립트를 깨고 나오는 것 방지. */
export function JsonLd({ id, data }: { id: string; data: object }) {
  return (
    <Script id={id} type="application/ld+json">
      {JSON.stringify(data).replace(/</g, "\\u003c")}
    </Script>
  );
}
