/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import Link from "next/link";

import { HeroRotatingWord } from "@/components/home/hero-rotating-word";

// ============ Mock data ============

const courses = [
  { code: "C01", level: "입문", title: "AI 리터러시와 업무활용", desc: "AI를 처음 마주하는 비전공자 직원이 일에 쓸 수 있는 기본기를 만든다.", duration: "1일", capacity: "80명", method: "비대면", color: "FFD43B", dark: false },
  { code: "C02", level: "입문", title: "데이터 리터러시", desc: "수치를 읽고 해석하는 감각. 데이터로 의사결정하는 첫걸음.", duration: "1일", capacity: "80명", method: "비대면", color: "DCE7F1", dark: false },
  { code: "C03", level: "리더", title: "관리자 AI 리더십", desc: "AI 도입 의사결정자가 알아야 할 핵심. 기술보다 전략과 조직.", duration: "1일", capacity: "80명", method: "비대면", color: "F1E2DC", dark: false },
  { code: "C04", level: "기초", title: "AI 어시스트 노코드 데이터분석", desc: "노코드 도구로 데이터에서 인사이트를 끌어낸다. 코드 없이.", duration: "1일", capacity: "20명", method: "비대면", color: "17150F", dark: true },
  { code: "C05", level: "기초", title: "AI 행정 융합 기획", desc: "AI 도구를 행정·실무에 어떻게 적용할지. 기획부터 실행까지.", duration: "2일", capacity: "60명", method: "비대면", color: "F0E9F7", dark: false },
  { code: "C06", level: "심화", title: "노코드 AI 서비스 구현", desc: "코드 한 줄 없이 AI 서비스를 만들어 본다. 실습 중심.", duration: "2일", capacity: "20명", method: "대면", color: "DCEFE5", dark: false },
  { code: "C07", level: "심화", title: "AI 어시스트 데이터분석 심화", desc: "AI를 분석 페어처럼 쓰는 법. 복잡한 데이터도 빠르게.", duration: "2일", capacity: "20명", method: "대면", color: "FFE9A8", dark: false },
  { code: "C08", level: "심화", title: "바이브코딩 LLM 서비스 개발", desc: "AI 페어와 코딩하며 LLM 서비스를 직접 만든다.", duration: "2일", capacity: "20명", method: "대면", color: "F1ECDC", dark: false },
];

const moments = [
  { tag: "01", title: "사전 인터뷰", body: "조직의 실제 업무 데이터·도구를 듣고 시작합니다." },
  { tag: "02", title: "현장 강의", body: "실무자 출신 강사가 사례·문제·해결로 풉니다." },
  { tag: "03", title: "1:1 코칭", body: "종강 후 8주, 부서별 적용을 함께 만듭니다." },
  { tag: "04", title: "사후 모니터링", body: "도입률·시간 단축을 추적해 다음 개선까지." },
];

const cases = [
  { quote: "처음에는 전사 도입 강의처럼 보였는데, 끝나니 우리 부서 일하는 방식이 바뀐 경험이 됐습니다.", name: "이○○", role: "마케팅 본부장", company: "대기업 B", metric: "41%", metricLabel: "보고 시간 단축", avatar: 11 },
  { quote: "사내 RAG 시스템을 우리가 직접 구축할 수 있다는 자신감이 가장 큰 성과였어요.", name: "박○○", role: "데이터팀 리드", company: "금융사 D", metric: "8주", metricLabel: "도입 완료까지", avatar: 32 },
  { quote: "‘교육 → 일터 적용’ 갭을 처음 메워준 프로그램이었습니다.", name: "김○○", role: "조직문화 리드", company: "공공기관 A", metric: "92%", metricLabel: "재교육 신청률", avatar: 44 },
  { quote: "비전공자 직원이 자기 업무 자동화 매뉴얼을 직접 만들기 시작했습니다.", name: "정○○", role: "운영 본부장", company: "커머스 C", metric: "30+", metricLabel: "부서 자체 운영", avatar: 26 },
  { quote: "외부 강의를 여러 번 받아봤지만 우리 데이터를 사례로 쓴 곳은 처음이었습니다.", name: "유○○", role: "CTO", company: "스타트업 F", metric: "6주", metricLabel: "도입 기간", avatar: 60 },
  { quote: "임원진 워크숍 후 의사결정에서 ‘AI를 어디에 쓸지’ 대화가 시작됐습니다.", name: "한○○", role: "CSO", company: "교육기관 E", metric: "100%", metricLabel: "임원진 참여", avatar: 23 },
  { quote: "단순 강의가 아니라 컨설팅에 가까웠어요. 우리 회사 맥락을 다 파악하고 옵니다.", name: "오○○", role: "HR Director", company: "현대차", metric: "4.8", metricLabel: "/ 5 만족도", avatar: 7 },
  { quote: "교육 후 8주차에 부서 자체 프롬프트 매뉴얼이 만들어진 게 가장 큰 변화입니다.", name: "신○○", role: "혁신팀 PM", company: "신한은행", metric: "30+", metricLabel: "프롬프트 매뉴얼", avatar: 47 },
  { quote: "우리 부서뿐 아니라 다른 부서까지 흘러간 점이 의외였습니다.", name: "조○○", role: "마케팅 디렉터", company: "BC카드", metric: "5개", metricLabel: "확산 부서", avatar: 50 },
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

const resources = [
  { tag: "Insights", title: "매일 인사이트", desc: "AI · 데이터 동향을 일터 언어로", href: "/insights" },
  { tag: "Guides", title: "실무 가이드", desc: "RAG · LLM · 자동화의 적용 패턴", href: "/guides" },
  { tag: "Reviews", title: "교육 후기", desc: "조직별 도입 과정과 결과 정리", href: "/cases" },
  { tag: "About", title: "데이지란?", desc: "우리는 어떻게 일하는 회사인가", href: "/about" },
];

// ============ helpers ============

const avatar = (id: number, size = 96) => `https://i.pravatar.cc/${size}?img=${id}`;

function CoursePreview({ icon, title, color, dark = false }: { icon: string; title: string; color: string; dark?: boolean }) {
  return (
    <div className="flex h-full w-full flex-col justify-between p-6" style={{ backgroundColor: `#${color}` }}>
      <span className={`font-mono text-[11px] font-bold uppercase tracking-[0.16em] ${dark ? "text-daisy" : "text-zinc-700"}`}>
        {icon}
      </span>
      <span className={`text-[20px] font-bold leading-[1.15] tracking-[-0.015em] ${dark ? "text-white" : "text-zinc-900"}`}>
        {title}
      </span>
    </div>
  );
}

// ============ Page ============

export default function HomePage() {
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
        {/* 옅은 daisy 그라디언트 */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-daisy/15 via-white to-white" />
        <div className="relative mx-auto max-w-[1280px] px-6 pb-16 pt-20 lg:px-10 lg:pb-20 lg:pt-24">
          <div className="grid grid-cols-12 gap-x-8 gap-y-12">
            <div className="col-span-12 lg:col-span-7">
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                AI · Data Education for Teams
              </p>
              <h1 className="mt-5 text-[44px] font-extrabold leading-[1.06] tracking-[-0.025em] text-[#0F0F0F] sm:text-[56px] lg:text-[64px]">
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
                비전공자 직원이 자기 일에 AI · 데이터를 쓸 수 있을 때까지. 누적 7,000명 이상이 수강한 맞춤형 교육 — 50+ 조직, 100+ 강사 파트너와 함께 만들어왔습니다.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-md bg-daisy px-6 py-3.5 text-[15px] font-bold text-[#17150F] transition hover:translate-y-[-1px] hover:shadow-[0_8px_20px_-8px_rgba(255,212,59,0.7)]"
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
                <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
                  {[
                    { stat: "7,000+", label: "누적 수강생" },
                    { stat: "9.5", label: "/ 10 만족도" },
                    { stat: "50+", label: "주요 고객사" },
                    { stat: "100+", label: "강사 파트너" },
                  ].map((m) => (
                    <div key={m.stat}>
                      <p className="text-[32px] font-extrabold tracking-[-0.02em] text-[#F5B83C] sm:text-[36px]">
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
                <Link href="/about" className="relative block aspect-[4/5] overflow-hidden rounded-2xl ds-card-soft transition duration-200 hover:-translate-y-1 hover:shadow-lg">
                  <Image src="/hero/about.jpg" alt="" fill priority sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="relative flex h-full w-full flex-col justify-between p-6">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                      ABOUT
                    </span>
                    <span className="text-[20px] font-bold leading-[1.15] tracking-[-0.015em] text-white">
                      데이지란?
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
            <h2 className="mt-3 text-[24px] font-extrabold leading-[1.2] tracking-[-0.015em] text-[#0F0F0F] sm:text-[28px]">
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

      {/* ============ Curriculum ============ */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">Curriculum</p>
              <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#0F0F0F] sm:text-[40px]">
                여덟 가지 코어 과정
              </h2>
              <p className="mt-3 max-w-xl text-[15.5px] text-zinc-600">
                입문·기초·심화·리더십까지. 모든 과정은 사전 인터뷰 후 조직 데이터·도구·언어에 맞춰 매번 처음부터 재설계됩니다.
              </p>
            </div>
            <Link href="/courses" className="group inline-flex items-center gap-1.5 self-start text-[14px] font-semibold text-zinc-900">
              전체 과정 보기
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((c) => (
              <li key={c.code}>
                <Link href={`/courses/${c.code.toLowerCase()}`} className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ds-card ds-card-lift">
                  <div className="aspect-[16/10]">
                    <CoursePreview icon={`${c.code} · ${c.level}`} title={c.title} color={c.color} dark={c.dark} />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-[16.5px] font-bold leading-[1.3] tracking-[-0.01em] text-[#0F0F0F]">
                      {c.title}
                    </h3>
                    <p className="mt-2 flex-1 text-[13.5px] leading-[1.6] text-zinc-600">{c.desc}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-zinc-100 pt-3 text-[12px] text-zinc-500">
                      <span className="font-medium text-zinc-700">{c.duration}</span>
                      <span>·</span>
                      <span>{c.capacity}</span>
                      <span>·</span>
                      <span>{c.method}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ Moments ============ */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">How we work</p>
            <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#0F0F0F] sm:text-[40px]">
              강의가 끝난 다음 날도<br />교육이 살아있도록.
            </h2>
          </div>

          <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {moments.map((m) => (
              <li key={m.tag} className="rounded-2xl bg-zinc-50/70 p-7">
                <p className="font-mono text-[11.5px] font-bold tracking-[0.18em] text-zinc-500">
                  {m.tag} / Step
                </p>
                <h3 className="mt-5 text-[19px] font-bold tracking-[-0.01em] text-[#0F0F0F]">{m.title}</h3>
                <p className="mt-2 text-[14px] leading-[1.7] text-zinc-600">{m.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ Cases ============ */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">Customer Stories</p>
              <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#0F0F0F] sm:text-[40px]">
                교육 후, 조직에 남은 변화.
              </h2>
              <p className="mt-3 max-w-xl text-[15.5px] text-zinc-600">
                강의가 아니라 ‘일하는 방식의 변화’. 수료한 조직의 실제 후기와 측정한 결과.
              </p>
            </div>
            <Link href="/cases" className="group inline-flex items-center gap-1.5 self-start text-[14px] font-semibold text-zinc-900">
              전체 사례 보기
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((c, i) => (
              <li key={i} className="flex flex-col rounded-2xl bg-white p-7 ds-card">
                <div className="flex items-baseline justify-between">
                  <p className="text-[36px] font-extrabold leading-none tracking-[-0.02em] text-[#0F0F0F]">
                    {c.metric}
                  </p>
                  <p className="text-[12px] font-medium text-zinc-500">{c.metricLabel}</p>
                </div>
                <p className="mt-7 flex-1 text-[14.5px] leading-[1.7] text-zinc-700">
                  “{c.quote}”
                </p>
                <div className="mt-7 flex items-center gap-3 border-t border-zinc-100 pt-5">
                  <img src={avatar(c.avatar, 80)} alt="" className="h-10 w-10 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-[#0F0F0F]">
                      {c.name} <span className="font-medium text-zinc-500">· {c.role}</span>
                    </p>
                    <p className="truncate text-[12.5px] text-zinc-500">{c.company}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ Resources ============ */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">Resources</p>
            <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#0F0F0F] sm:text-[40px]">
              교실 밖 콘텐츠
            </h2>
          </div>

          <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {resources.map((r) => (
              <li key={r.tag}>
                <Link
                  href={r.href}
                  className="group flex h-full flex-col rounded-2xl bg-white p-7 ds-card ds-card-lift"
                >
                  <p className="font-mono text-[11.5px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    {r.tag}
                  </p>
                  <h3 className="mt-5 text-[19px] font-bold tracking-[-0.01em] text-[#0F0F0F]">{r.title}</h3>
                  <p className="mt-2 flex-1 text-[14px] leading-[1.65] text-zinc-600">{r.desc}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-zinc-900 transition group-hover:gap-2.5">
                    바로가기
                    <span aria-hidden>→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ Final CTA ============ */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="rounded-3xl bg-[#17150F] p-10 text-white sm:p-16 lg:p-20">
            <div className="grid grid-cols-12 gap-x-8 gap-y-8">
              <div className="col-span-12 lg:col-span-8">
                <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-daisy">
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
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-daisy px-7 py-4 text-[15px] font-bold text-[#0F0F0F] transition hover:bg-daisy/90"
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
