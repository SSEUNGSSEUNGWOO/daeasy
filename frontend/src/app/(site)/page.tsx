/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import Link from "next/link";

import { HeroRotatingWord } from "@/components/home/hero-rotating-word";
import { AWARD_ARTICLE_URL } from "@/lib/award";
import { fetchCourses } from "@/lib/courses";
import { fetchInsights } from "@/lib/insights";

// ============ Mock data ============

const moments = [
  { tag: "01", title: "사전 인터뷰", body: "조직의 실제 업무 데이터·도구를 듣고 시작합니다." },
  { tag: "02", title: "맞춤 커리큘럼 설계", body: "산업·직군·도구를 반영해 매번 처음부터 재설계합니다." },
  { tag: "03", title: "현장 강의", body: "실무자 출신 강사가 사례·문제·해결로 풉니다." },
  { tag: "04", title: "사후 코칭·모니터링", body: "종강 후 8주, 부서별 적용과 도입률 추적까지." },
];

type Partner = { name: string; logo?: string };

const partners: Partner[] = [
  // 시그니처 4개 (Hero trust strip 노출)
  { name: "행정안전부", logo: "/partners/mois.png" },
  { name: "농촌진흥청", logo: "/partners/rda.png" },
  { name: "한국지능정보사회진흥원", logo: "/partners/nia.png" },
  { name: "한라그룹", logo: "/partners/halla.png" },
  // 그 외
  { name: "식품의약품안전처", logo: "/partners/mfds.png" },
  { name: "국민건강보험", logo: "/partners/nhis.png" },
  { name: "관세청", logo: "/partners/customs.png" },
  { name: "서울교통공사", logo: "/partners/seoul-metro.png" },
  { name: "부산광역시", logo: "/partners/busan.png" },
  { name: "부산광역시교육청", logo: "/partners/bsedu.png" },
  { name: "한국과학창의재단", logo: "/partners/kofac.png" },
  { name: "한국데이터산업협회", logo: "/partners/kdata.png" },
  { name: "동우화인캠주식회사", logo: "/partners/dongwoo.png" },
  { name: "가평군", logo: "/partners/gapyeong.png" },
  { name: "구리시", logo: "/partners/guri.png" },
  { name: "여주시", logo: "/partners/yeoju.png" },
];

const TRACK_PATTERN = /^\[([^\]]+)\]\s*/;

function splitTrack(title: string): { track: string; clean: string } {
  const m = title.match(TRACK_PATTERN);
  if (!m) return { track: "공개 과정", clean: title };
  return { track: m[1], clean: title.slice(m[0].length) };
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function formatDate(value: string) {
  return dateFormatter.format(new Date(value)).replace(/\.\s?$/, "").replace(/\.\s/g, ".");
}

// ============ Page ============

export default async function HomePage() {
  const [allCourses, allInsights] = await Promise.all([
    fetchCourses(),
    fetchInsights(),
  ]);
  // 추천: 표준 과정 위주 + 난이도 mix. sort_order 3,4,5,6,14,25 같은 셀렉션 대신 단순히 처음 6개.
  const featuredCourses = allCourses
    .filter((c) => c.title.includes("[표준 과정]"))
    .slice(0, 6);
  const latestInsights = allInsights.slice(0, 3);

  return (
    <>
      <style>{`
        .ds-card { border: 1px solid #EAEAEA; }
        .ds-card-soft { box-shadow: 0 1px 2px rgba(15, 15, 15, 0.04); border: 1px solid #ECECEC; }
        .ds-card-lift { transition: transform 220ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 220ms cubic-bezier(0.2,0.8,0.2,1), border-color 220ms; }
        .ds-card-lift:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(15,15,15,0.08); border-color: #DADADA; }
      `}</style>

      {/* ============ Hero ============ */}
      <section className="relative isolate overflow-hidden bg-white">
        {/* 옅은 accent 그라디언트 */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-accent/10 via-white to-white" />
        <div className="relative mx-auto max-w-[1280px] px-6 pb-16 pt-20 lg:px-10 lg:pb-20 lg:pt-24 anim-page-fade-up">
          <div className="grid grid-cols-12 gap-x-8 gap-y-12">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                AI · Data Education for Teams
              </p>
              <h1 className="mt-5 text-[44px] font-extrabold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[56px] lg:text-[64px]">
                우리 조직 모든 직원이<br />
                AI · 데이터를{" "}
                <HeroRotatingWord
                  words={[
                    "이해한다.",
                    "의사결정에 쓴다.",
                    "도입한다.",
                    "자동화한다.",
                    "다룬다.",
                  ]}
                />
              </h1>
              <p className="mt-7 max-w-[580px] text-[17px] leading-[1.7] text-zinc-600">
                비전공자 직원이 자기 일에 AI · 데이터를 쓸 수 있을 때까지. 누적 10만 명 이상이 수강한 맞춤형 교육 — 50+ 조직, 100+ 강사 파트너와 함께 만들어왔습니다.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3.5 text-[15px] font-bold text-white transition hover:translate-y-[-1px] hover:shadow-[0_8px_20px_-8px_rgba(37,99,235,0.7)]"
                >
                  교육 문의하기
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-6 py-3.5 text-[15px] font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
                >
                  커리큘럼 보기
                </Link>
              </div>

              <div className="mt-14 rounded-2xl border border-zinc-200/70 bg-zinc-50 p-7 sm:p-8">
                <a
                  href={AWARD_ARTICLE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3.5 border-b border-zinc-200/70 pb-6"
                >
                  <Image
                    src="/awards/k-digital-brand-award-2026.png"
                    alt="2026 K-디지털 브랜드 대상"
                    width={270}
                    height={269}
                    className="h-12 w-12 shrink-0"
                    unoptimized
                  />
                  <div>
                    <p className="text-[14.5px] font-bold leading-[1.45] tracking-[-0.01em] text-ink group-hover:underline">
                      2026 K-디지털 브랜드 대상 수상
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-zinc-600">
                      AI · 데이터 교육 부문
                    </p>
                  </div>
                </a>
                <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
                  {[
                    { stat: "10만+", label: "누적 수강생" },
                    { stat: "9.5", label: "/ 10 만족도" },
                    { stat: "50+", label: "주요 고객사" },
                    { stat: "100+", label: "강사 파트너" },
                  ].map((m) => (
                    <div key={m.stat}>
                      <p className="text-[32px] font-extrabold tracking-[-0.02em] text-accent-warm sm:text-[36px]">
                        {m.stat}
                      </p>
                      <p className="mt-1 text-[12.5px] font-medium text-zinc-600">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-5">
              <div className="grid grid-cols-2 gap-4">
                <Link href="/cases" className="relative block aspect-[4/5] overflow-hidden rounded-2xl ds-card-soft transition duration-200 hover:-translate-y-1 hover:shadow-lg">
                  <Image src="/hero/cases.jpg" alt="" fill priority sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="relative flex h-full w-full flex-col justify-between p-6">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                      REVIEWS
                    </span>
                    <span className="text-[20px] font-bold leading-[1.15] tracking-[-0.015em] text-white">
                      교육 후기
                    </span>
                  </div>
                </Link>
                <Link href="/quiz" className="relative mt-10 block aspect-[4/5] overflow-hidden rounded-2xl ds-card-soft transition duration-200 hover:-translate-y-1 hover:shadow-lg">
                  <Image src="/hero/quiz.jpg" alt="" fill priority sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="relative flex h-full w-full flex-col justify-between p-6">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                      RECOMMEND
                    </span>
                    <span className="whitespace-pre-line text-[20px] font-bold leading-[1.15] tracking-[-0.015em] text-white">
                      {"내게 맞는\n교육 찾기"}
                    </span>
                  </div>
                </Link>
                <Link href="/insights" className="relative block aspect-[4/5] overflow-hidden rounded-2xl ds-card-soft transition duration-200 hover:-translate-y-1 hover:shadow-lg">
                  <Image src="/hero/news.jpg" alt="" fill priority sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="relative flex h-full w-full flex-col justify-between p-6">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                      INSIGHTS
                    </span>
                    <span className="whitespace-pre-line text-[20px] font-bold leading-[1.15] tracking-[-0.015em] text-white">
                      {"AI · 데이터\n인사이트"}
                    </span>
                  </div>
                </Link>
                <Link href="/contact" className="relative mt-10 block aspect-[4/5] overflow-hidden rounded-2xl ds-card-soft transition duration-200 hover:-translate-y-1 hover:shadow-lg">
                  <Image src="/hero/post.jpg" alt="" fill priority sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="relative flex h-full w-full flex-col justify-between p-6">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                      CONTACT
                    </span>
                    <span className="whitespace-pre-line text-[20px] font-bold leading-[1.15] tracking-[-0.015em] text-white">
                      {"교육 도입\n문의하기"}
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ============ Partners ============ */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 pt-16 lg:px-10 lg:pt-20">
          <div className="text-center">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Together with
            </p>
            <h2 className="mt-3 text-[24px] font-extrabold leading-[1.2] tracking-[-0.015em] text-ink sm:text-[28px]">
              지금까지 함께한 50+ 조직 중 일부.
            </h2>
          </div>
        </div>
        <div className="mt-10 mb-16 lg:mb-20 overflow-hidden py-6 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="marquee-track flex w-max gap-12">
            {[...partners, ...partners].map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className="group relative z-0 flex h-12 w-[180px] flex-shrink-0 items-center justify-center hover:z-10"
                aria-hidden={i >= partners.length}
              >
                {p.logo ? (
                  <img
                    src={p.logo}
                    alt={p.name}
                    className="h-10 w-auto max-w-[180px] object-contain transition-transform duration-200 ease-out group-hover:scale-150"
                  />
                ) : (
                  <span className="text-center text-[14.5px] font-semibold text-zinc-500 transition-transform duration-200 group-hover:scale-125">
                    {p.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Featured courses ============ */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">Programs</p>
              <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">
                추천 교육과정.
              </h2>
              <p className="mt-3 max-w-xl text-[15.5px] text-zinc-600">
                AI 리터러시부터 LLM 서비스 개발까지. 모든 과정은 사전 인터뷰 후 조직 데이터·도구에 맞춰 재설계됩니다.
              </p>
            </div>
            <Link href="/courses" className="group inline-flex items-center gap-1.5 self-start text-[14px] font-semibold text-zinc-900">
              전체 과정 보기
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 reveal-stagger">
            {featuredCourses.map((c) => {
              const { track, clean } = splitTrack(c.title);
              return (
                <li key={c.slug}>
                  <Link
                    href={`/courses/${c.slug}`}
                    className="group flex h-full flex-col rounded-2xl bg-white p-7 ring-1 ring-zinc-100 transition hover:-translate-y-[2px] hover:shadow-[0_8px_24px_-12px_rgba(15,15,15,0.18)] hover:ring-zinc-200"
                  >
                    <span className="self-start rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                      {track}
                    </span>
                    <h3 className="mt-4 text-[18px] font-bold leading-[1.35] tracking-[-0.01em] text-ink">
                      {clean}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-[14px] leading-[1.65] text-zinc-600">
                      {c.summary}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-1 text-[13px] font-bold text-zinc-500 transition group-hover:text-accent">
                      자세히 보기 →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ============ Process ============ */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">How we work</p>
            <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">
              인터뷰부터 사후 코칭까지<br />네 단계로 진행합니다.
            </h2>
          </div>

          <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 reveal-stagger">
            {moments.map((m) => (
              <li key={m.tag} className="rounded-2xl bg-zinc-50/70 p-7">
                <p className="font-mono text-[11.5px] font-bold tracking-[0.18em] text-accent">
                  Step {m.tag}
                </p>
                <h3 className="mt-5 text-[19px] font-bold tracking-[-0.01em] text-ink">{m.title}</h3>
                <p className="mt-2 text-[14px] leading-[1.7] text-zinc-600">{m.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ Latest insights ============ */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">Insights</p>
              <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">
                최신 인사이트.
              </h2>
              <p className="mt-3 max-w-xl text-[15.5px] text-zinc-600">
                AI · 데이터 동향을 일터 언어로 매일 정리해 보내드립니다.
              </p>
            </div>
            <Link href="/insights" className="group inline-flex items-center gap-1.5 self-start text-[14px] font-semibold text-zinc-900">
              인사이트 전체 보기
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {latestInsights.length === 0 ? (
            <p className="mt-12 rounded-2xl bg-white p-10 text-center text-[14px] text-zinc-500 ring-1 ring-zinc-100">
              곧 첫 인사이트가 발행됩니다.
            </p>
          ) : (
            <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 reveal-stagger">
              {latestInsights.map((insight) => (
                <li key={insight.slug}>
                  <Link
                    href={`/insights/${insight.slug}`}
                    className="group block h-full overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-100 transition hover:-translate-y-[2px] hover:shadow-[0_8px_24px_-12px_rgba(15,15,15,0.18)] hover:ring-zinc-200"
                  >
                    <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-100">
                      {insight.image_url ? (
                        <img
                          src={insight.image_url}
                          alt=""
                          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                        />
                      ) : null}
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {insight.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-[17px] font-bold leading-[1.35] tracking-[-0.01em] text-ink">
                        {insight.title}
                      </h3>
                      <p className="mt-3 text-[12.5px] font-semibold text-zinc-500">
                        {formatDate(insight.published_at)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ============ Rentals banner ============ */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="grid grid-cols-1 overflow-hidden rounded-3xl ring-1 ring-zinc-100 lg:grid-cols-2">
            <div className="relative aspect-[4/3] lg:aspect-auto">
              <Image
                src="/rentals/space-1.jpg"
                alt="DMC타워 교육장 내부"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center bg-zinc-50/70 p-10 sm:p-14">
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">
                Classroom rental
              </p>
              <h2 className="mt-3 text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[36px]">
                강의실 대관도<br />가능합니다.
              </h2>
              <p className="mt-5 text-[15px] leading-[1.8] text-zinc-700">
                DMC역과 지하통로로 연결된 단독 대관 교육장. 137.82㎡(약 41.69평), 최대 48명, 빔프로젝터·기가 인터넷 완비.
              </p>
              <Link
                href="/rentals"
                className="mt-7 inline-flex w-fit items-center gap-2 rounded-md bg-ink px-6 py-3 text-[14px] font-bold text-white transition hover:bg-ink-hover"
              >
                강의실 자세히 보기
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Final CTA ============ */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="rounded-3xl bg-ink-warm p-10 text-white sm:p-16 lg:p-20">
            <div className="grid grid-cols-12 gap-x-8 gap-y-8">
              <div className="col-span-12 lg:col-span-8">
                <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">
                  Get in touch
                </p>
                <h2 className="mt-3 text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-[52px]">
                  조직에 맞춘 교육,<br />이야기부터 시작합시다.
                </h2>
                <p className="mt-6 max-w-2xl text-[16px] leading-[1.8] text-zinc-300">
                  상담은 무료입니다. 사전 인터뷰 후 맞춤 커리큘럼 제안서를 일주일 내 보내드립니다.
                </p>
              </div>
              <div className="col-span-12 flex flex-col gap-3 self-end sm:flex-row lg:col-span-4 lg:flex-col">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-7 py-4 text-[15px] font-bold text-white transition hover:bg-accent/90"
                >
                  교육 문의하기
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-white/25 bg-transparent px-7 py-4 text-[15px] font-semibold text-white transition hover:border-white/50 hover:bg-white/5"
                >
                  커리큘럼 보기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
