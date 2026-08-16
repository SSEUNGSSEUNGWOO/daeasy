import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI 챔피언",
  description:
    "공공행정 현장의 AI 전환을 이끄는 실무 인재를 양성·인증하는 AI 챔피언 Green·Blue·Black 체계를 소개합니다.",
};

const tracks = [
  {
    name: "Green",
    level: "초급",
    role: "실무 기획자",
    title: "아이디어를 정책과 서비스로 구체화합니다.",
    body: "생성형 AI와 노코드 도구를 활용해 행정 혁신 아이디어를 기획안과 업무 프로토타입으로 구현합니다.",
    audience: "비개발 실무자",
    accent: "border-emerald-500",
    badge: "bg-emerald-50 text-emerald-700",
  },
  {
    name: "Blue",
    level: "중급",
    role: "AI 전환 실행자",
    title: "PoC부터 구축까지 실행을 주도합니다.",
    body: "데이터 분석과 모델링, LLM API·RAG·FastAPI를 활용해 기관 맞춤형 AI 서비스를 설계하고 구현합니다.",
    audience: "IT 담당자·개발 인력",
    accent: "border-blue-600",
    badge: "bg-blue-50 text-blue-700",
  },
  {
    name: "Black",
    level: "고급 · 2026 신설",
    role: "AI 거점 리더",
    title: "기관의 AI 전환과 확산을 이끕니다.",
    body: "고급 AI 기술과 도구 생태계를 바탕으로 기관 단위 전환을 리딩하고 동료 코칭과 우수사례 확산을 주도합니다.",
    audience: "AI 챔피언 고급과정 인증자",
    accent: "border-zinc-950",
    badge: "bg-zinc-950 text-white",
  },
] as const;

const journey = [
  ["01", "선수과목", "AI·데이터 기초역량을 갖춥니다."],
  ["02", "이러닝", "등급별 지정 과목을 학습합니다."],
  ["03", "집중수업", "3일 동안 과제 중심으로 실습합니다."],
  ["04", "셀프스터디", "개인별 문제 해결 과제를 수행합니다."],
  ["05", "수행평가", "실제 업무형 과제로 역량을 검증합니다."],
  ["06", "인증", "기준 충족 시 등급별 인증서를 발급합니다."],
] as const;

const assessmentAreas = [
  {
    number: "01",
    title: "생성형 AI 활용",
    body: "행정문서와 콘텐츠를 목적에 맞게 생성·재구성하고 결과를 검증하는 역량",
  },
  {
    number: "02",
    title: "데이터 분석",
    body: "공공데이터를 정제·분석하고 근거 있는 해석과 인사이트를 도출하는 역량",
  },
  {
    number: "03",
    title: "서비스 구현",
    body: "AI 도구와 관련 기술을 활용해 실제 동작하는 웹서비스와 자동화 도구를 구현하는 역량",
  },
] as const;

const certificationRoutes = [
  ["교육과정형", "종합과정에 참여한 뒤 수행평가를 통해 인증받습니다."],
  ["자기주도형", "공개 학습자료로 준비하고 종합과정 없이 수행평가에 참여합니다."],
  ["자격연계형", "지정 자격증과 교육과목 이수 요건을 결합해 Blue 인증을 취득합니다."],
] as const;

const operationScopes = [
  ["역량체계 설계", "역량진단 모델과 평가 지표 개발"],
  ["교육 운영", "종합과정 운영과 학습·과제 지원"],
  ["인증평가", "CBT, 본인확인, 실시간 화상 감독"],
  ["결과 관리", "채점·심사, 통계와 인증 운영 지원"],
] as const;

export default function AiChampionPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink-warm text-white">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.3),transparent_38%)]" />
        <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10 lg:py-32 anim-page-fade-up">
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-blue-300">공공 AI 인재</p>
          <h1 className="mt-5 max-w-5xl text-[44px] font-extrabold leading-[1.06] tracking-[-0.03em] sm:text-[60px] lg:text-[72px]">
            공공행정 현장의 AI 전환을 이끄는<br />실무 인재, AI 챔피언
          </h1>
          <p className="mt-8 max-w-3xl text-[17px] leading-[1.8] text-zinc-300 sm:text-[19px]">
            AI 챔피언은 공공행정 분야의 현업 문제를 AI와 데이터로 해결하고,
            기관의 변화를 주도할 실무 인재를 양성·인증하는 제도입니다.
          </p>
          <div className="mt-10 flex flex-wrap gap-3" aria-label="AI 챔피언 인증 등급">
            {tracks.map((track) => (
              <span key={track.name} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[13px] font-bold backdrop-blur-sm">
                {track.name} · {track.role}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28 reveal">
          <div className="max-w-3xl">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">세 개의 등급</p>
            <h2 className="mt-3 text-[34px] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[46px]">
              기획에서 구현으로,<br />구현에서 조직의 확산으로.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.8] text-zinc-600">
              역할과 숙련도에 따라 Green·Blue·Black 세 등급으로 성장합니다.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3 reveal-stagger">
            {tracks.map((track) => (
              <article key={track.name} className={`rounded-2xl border-t-4 ${track.accent} bg-white p-7 shadow-sm ring-1 ring-zinc-200/80 sm:p-8`}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">{track.name}</p>
                  <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${track.badge}`}>{track.level}</span>
                </div>
                <p className="mt-7 text-[12px] font-bold uppercase tracking-[0.15em] text-zinc-500">{track.role}</p>
                <h3 className="mt-2 text-[21px] font-bold leading-[1.35] tracking-[-0.015em] text-ink">{track.title}</h3>
                <p className="mt-4 text-[14px] leading-[1.75] text-zinc-600">{track.body}</p>
                <div className="mt-7 border-t border-zinc-100 pt-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">대상</p>
                  <p className="mt-1.5 text-[14px] font-semibold text-zinc-700">{track.audience}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-5 text-[12.5px] leading-[1.7] text-zinc-500">
            Black은 2026년 신설된 고급과정 연계 등급으로, 올해는 보수교육형으로 운영됩니다.
          </p>
        </div>
      </section>

      <section className="border-y border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28 reveal">
          <div className="max-w-3xl">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">학습 여정</p>
            <h2 className="mt-3 text-[34px] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[46px]">
              학습하고, 만들고, 역량을 증명합니다.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.8] text-zinc-600">
              단순한 시험이 아니라 학습과 실습, 현업형 과제 수행이 연결된 종합과정입니다.
            </p>
          </div>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-zinc-200 ring-1 ring-zinc-200 sm:grid-cols-2 lg:grid-cols-3">
            {journey.map(([number, title, body]) => (
              <li key={number} className="bg-white p-7">
                <p className="font-mono text-[12px] font-bold text-accent">{number}</p>
                <h3 className="mt-4 text-[19px] font-bold text-ink">{title}</h3>
                <p className="mt-2 text-[14px] leading-[1.7] text-zinc-600">{body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-[12.5px] text-zinc-500">
            종합과정은 과정 안내·집중수업·셀프스터디·수행평가를 포함해 총 41시간으로 구성됩니다. 이러닝 학습 시간은 별도입니다.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28 reveal">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">역량 평가</p>
              <h2 className="mt-3 text-[34px] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[46px]">
                실제 업무형 과제로<br />세 가지 역량을 평가합니다.
              </h2>
              <p className="mt-5 text-[16px] leading-[1.8] text-zinc-600">
                Green과 Blue는 같은 영역을 평가하되 역할과 숙련도에 맞춰 요구 수준을 다르게 적용합니다.
              </p>
              <div className="mt-8 rounded-2xl bg-ink-warm p-6 text-white">
                <p className="text-[13px] font-bold text-blue-300">인증 기준</p>
                <p className="mt-2 text-[20px] font-extrabold">수행평가 90점 + 이러닝 10점</p>
                <p className="mt-2 text-[14px] text-zinc-300">총점 75점 이상 · 절대평가</p>
              </div>
            </div>
            <div className="grid gap-4">
              {assessmentAreas.map((area) => (
                <article key={area.number} className="rounded-2xl bg-zinc-50 p-7 ring-1 ring-zinc-100 sm:flex sm:gap-6">
                  <p className="font-mono text-[12px] font-bold text-accent">{area.number}</p>
                  <div className="mt-3 sm:mt-0">
                    <h3 className="text-[20px] font-bold text-ink">{area.title}</h3>
                    <p className="mt-2 text-[14px] leading-[1.75] text-zinc-600">{area.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28 reveal">
          <div className="max-w-3xl">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">인증 경로</p>
            <h2 className="mt-3 text-[34px] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[46px]">역량에 맞는 방식으로 도전합니다.</h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {certificationRoutes.map(([title, body], index) => (
              <article key={title} className="rounded-2xl bg-white p-7 ring-1 ring-zinc-200/80">
                <p className="font-mono text-[12px] font-bold text-accent">0{index + 1}</p>
                <h3 className="mt-4 text-[20px] font-bold text-ink">{title}</h3>
                <p className="mt-3 text-[14px] leading-[1.75] text-zinc-600">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28 reveal">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">데이지의 운영 경험</p>
              <h2 className="mt-3 text-[34px] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[46px]">
                체계를 설계하고,<br />교육과 인증을 운영했습니다.
              </h2>
              <p className="mt-5 max-w-xl text-[16px] leading-[1.8] text-zinc-600">
                DAEASY는 2025년 시범사업에서 역량진단 모델과 평가 지표를 개발하고 종합과정과 인증평가 운영을 수행했습니다.
              </p>
            </div>
            <ul className="grid gap-px overflow-hidden rounded-2xl bg-zinc-200 ring-1 ring-zinc-200 sm:grid-cols-2">
              {operationScopes.map(([title, body]) => (
                <li key={title} className="bg-white p-7">
                  <h3 className="text-[17px] font-bold text-ink">{title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.7] text-zinc-600">{body}</p>
                </li>
              ))}
            </ul>
          </div>
          <dl className="mt-12 grid overflow-hidden rounded-2xl bg-blue-50 ring-1 ring-blue-100 sm:grid-cols-3">
            <div className="p-7 text-center sm:border-r sm:border-blue-100">
              <dt className="text-[13px] font-bold text-zinc-600">교육 수료</dt>
              <dd className="mt-2 text-[36px] font-extrabold tracking-[-0.03em] text-ink">1,372명</dd>
            </div>
            <div className="border-y border-blue-100 p-7 text-center sm:border-x sm:border-y-0">
              <dt className="text-[13px] font-bold text-zinc-600">표준 콘텐츠 개발</dt>
              <dd className="mt-2 text-[36px] font-extrabold tracking-[-0.03em] text-ink">12종</dd>
            </div>
            <div className="p-7 text-center sm:border-l sm:border-blue-100">
              <dt className="text-[13px] font-bold text-zinc-600">인증평가 운영</dt>
              <dd className="mt-2 text-[36px] font-extrabold tracking-[-0.03em] text-ink">541명</dd>
            </div>
          </dl>
          <p className="mt-3 text-right text-[12px] text-zinc-500">2025년 시범사업 기준</p>
        </div>
      </section>

      <section className="bg-white px-6 pb-20 lg:px-10 lg:pb-28">
        <div className="mx-auto max-w-[1280px] rounded-3xl bg-ink-warm p-10 text-white sm:p-16 lg:p-20 reveal">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-blue-300">교육 × 인증</p>
              <h2 className="mt-3 text-[36px] font-extrabold leading-[1.08] tracking-[-0.025em] sm:text-[52px]">
                공공 현장에 필요한 AI 역량,<br />교육부터 적용까지 설계합니다.
              </h2>
              <p className="mt-6 max-w-2xl text-[16px] leading-[1.8] text-zinc-300">
                기관의 직무와 목표에 맞는 AI·데이터 교육과 역량진단 운영을 상담해 보세요.
              </p>
            </div>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-7 py-4 text-[15px] font-bold text-white transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
              교육·운영 문의하기
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
