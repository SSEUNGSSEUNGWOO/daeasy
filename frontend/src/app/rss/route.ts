import { fetchInsights } from "@/lib/insights";
import { SITE_URL } from "@/lib/site";

// 옛 아임웹 사이트가 /rss 를 냈고 네이버 서치어드바이저에 그 주소가 등록돼 있어 경로를 유지한다
export const revalidate = 60;

const escape = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] ?? c);

export async function GET() {
  const insights = await fetchInsights();
  const items = insights
    .map(
      (i) => `<item>
<title>${escape(i.title)}</title>
<link>${SITE_URL}/insights/${encodeURIComponent(i.slug)}</link>
<guid>${SITE_URL}/insights/${encodeURIComponent(i.slug)}</guid>
<pubDate>${new Date(i.published_at).toUTCString()}</pubDate>
<category>${escape(i.category)}</category>
</item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>DAEASY(데이지) 인사이트</title>
<link>${SITE_URL}/insights</link>
<description>기업·공공기관 AI·데이터 교육 브랜드 데이지의 AI·데이터 인사이트</description>
<language>ko</language>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
