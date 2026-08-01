/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { RevealList } from "@/components/reveal";
import { fetchGuide } from "@/lib/guides";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function formatDate(value: string | null) {
  if (!value) return "";
  return dateFormatter.format(new Date(value)).replace(/\.\s?$/, "").replace(/\.\s/g, ".");
}

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
  } catch {}
  return null;
}

export async function generateMetadata(props: PageProps<"/guides/[slug]">) {
  const { slug } = await props.params;
  const g = await fetchGuide(slug);
  if (!g) return { title: "가이드" };
  return { title: g.title, description: g.summary };
}

export default async function GuideDetailPage(props: PageProps<"/guides/[slug]">) {
  const { slug } = await props.params;
  const g = await fetchGuide(slug);
  if (!g) notFound();

  return (
    <article className="mx-auto max-w-[820px] px-6 py-16 lg:py-20 anim-page-fade-up">
      <Link
        href="/guides"
        className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500 transition hover:text-zinc-900"
      >
        ← Guides
      </Link>

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          {g.category && (
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
              {g.category}
            </span>
          )}
          {g.difficulty && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
              {g.difficulty}
            </span>
          )}
          <time className="ml-auto text-[12.5px] font-semibold tracking-[0.04em] text-zinc-500">
            {formatDate(g.published_at)}
          </time>
        </div>
        <h1 className="mt-5 text-[36px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[44px]">
          {g.title}
        </h1>
        <p className="mt-5 text-[17px] leading-[1.7] text-zinc-700">{g.summary}</p>
      </header>

      {g.cover_url ? (
        <div className="mt-10 overflow-hidden rounded-2xl bg-zinc-100 anim-cover-scale-fade">
          <img src={g.cover_url} alt="" className="aspect-[16/9] w-full object-cover" />
        </div>
      ) : null}

      {g.tldr.length > 0 && (
        <section className="mt-12 rounded-2xl bg-zinc-50/70 p-7 ring-1 ring-zinc-100">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-accent">TL;DR</p>
          <ul className="mt-4 space-y-2 text-[15px] leading-[1.7] text-zinc-800">
            {g.tldr.map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-mono text-[12px] text-zinc-400">{String(i + 1).padStart(2, "0")}</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="prose prose-zinc mt-12 max-w-none text-[16px] leading-[1.85] prose-headings:tracking-[-0.015em] prose-headings:text-ink prose-a:text-accent prose-a:underline-offset-4">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{g.body}</ReactMarkdown>
      </div>

      {g.videos.length > 0 && (
        <section className="mt-16 border-t border-zinc-200 pt-10">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">관련 영상</h2>
          <RevealList className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {g.videos.map((v, i) => {
              const id = youtubeId(v.url);
              const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
              return (
                <li key={`${v.url}-${i}`}>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group block"
                  >
                    <div className="overflow-hidden rounded-xl bg-zinc-100">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          loading="lazy"
                          className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="aspect-video w-full" />
                      )}
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-[14px] font-semibold leading-snug text-zinc-900 group-hover:text-accent">
                      {v.title || v.url}
                    </h3>
                    {v.channel && (
                      <p className="mt-1 text-[12.5px] text-zinc-500">{v.channel}</p>
                    )}
                  </a>
                </li>
              );
            })}
          </RevealList>
        </section>
      )}

      {g.tags.length > 0 && (
        <div className="mt-12 flex flex-wrap gap-2">
          {g.tags.map((t) => (
            <span key={t} className="rounded-full bg-zinc-100 px-2.5 py-1 text-[12px] font-semibold text-zinc-700">
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-16 rounded-2xl bg-zinc-50/70 p-8 ring-1 ring-zinc-100">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">Get in touch</p>
        <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.01em] text-ink">
          이 주제로 교육이 필요하신가요?
        </h2>
        <p className="mt-3 text-[15px] leading-[1.8] text-zinc-700">
          가이드에 다룬 도구·워크플로우를 조직 데이터에 맞춰 강의로 받을 수 있습니다.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-ink px-5 py-3 text-[14px] font-bold text-white transition hover:bg-ink-hover"
        >
          교육 문의하기 →
        </Link>
      </div>
    </article>
  );
}
