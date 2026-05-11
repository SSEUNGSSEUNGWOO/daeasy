import DOMPurify from "isomorphic-dompurify";

/**
 * DB / 외부에서 들어온 HTML 을 dangerouslySetInnerHTML 에 넣기 전 sanitize.
 * - <script>, on* 핸들러, javascript: URL 등 제거
 * - 우리 콘텐츠가 사용하는 태그(h3-h6, p, ul/ol/li, dl/dt/dd, strong, em, br, span, section, blockquote, a, table)는 허용
 * - data-* 속성 일부 보존 (course-description 의 data-module 등)
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

const ALLOWED_ATTR = [
  "class", "href", "target", "rel",
  "src", "alt", "title",
  "data-module", "data-section",
];

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // a 태그는 href 외부 URL 허용, 단 javascript: 같은 위험 스킴 제거 (DOMPurify 기본)
    ADD_ATTR: [],
  });
}
