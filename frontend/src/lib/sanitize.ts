import "server-only";

import sanitize from "sanitize-html";

/**
 * DB / 외부에서 들어온 HTML 을 그대로 렌더하기 전 sanitize.
 * - <script>, on* 핸들러, javascript: URL 등 제거
 * - 우리 콘텐츠가 사용하는 태그(h3-h6, p, ul/ol/li, dl/dt/dd, strong, em, br, span, section, blockquote, a, table)는 허용
 * - data-* 속성 일부 보존 (course-description 의 data-module 등)
 *
 * jsdom 을 쓰는 DOMPurify 계열은 쓰지 않는다 — Vercel 함수 런타임이
 * `--no-experimental-require-module` 로 뜨는 탓에 jsdom 이 ESM 전용 의존을
 * require 하다 죽는다. sanitize-html 은 htmlparser2 기반이라 DOM 이 필요 없다.
 * 그래서 이 모듈은 server-only 이며, 클라이언트 컴포넌트가 렌더할 HTML 도
 * 서버 컴포넌트에서 미리 통과시킨 뒤 prop 으로 전달한다.
 */
const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "ul", "ol", "li",
  "dl", "dt", "dd",
  "strong", "em", "b", "i", "u",
  "span", "section", "div", "blockquote",
  "a", "code", "pre",
  "table", "thead", "tbody", "tr", "th", "td",
  "img", "figure", "figcaption",
];

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return sanitize(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      "*": ["class", "title", "data-module", "data-section"],
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
    },
    // href / src 는 위험 스킴 제거 (javascript: 등)
    allowedSchemes: ["http", "https", "mailto", "tel"],
  });
}
