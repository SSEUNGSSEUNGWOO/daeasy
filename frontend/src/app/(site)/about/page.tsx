import Image from "next/image";
import Link from "next/link";

import { AWARD_ARTICLE_URL } from "@/lib/award";

export const metadata = { title: "데이지란?" };

const numbers = [
  { stat: "10만+", label: "누적 수강생" },
  { stat: "9.5", label: "/ 10 만족도" },
  { stat: "50+", label: "주요 고객사" },
  { stat: "100+", label: "강사 파트너" },
  { stat: "100+", label: "연간 교육 회차" },
];

const values = [
  { tag: "01", title: "실무 중심 교육", body: "프로젝트 기반 학습. 실제 조직의 데이터와 문제를 가지고 풀어내는 방식으로 진행합니다." },
  { tag: "02", title: "최신 커리큘럼", body: "생성 AI · LLM · RAG 등 빠르게 변하는 영역도 커리큘럼이 따라가도록 지속 업데이트합니다." },
  { tag: "03", title: "실습 + 복습", body: "강의실에서 끝나지 않도록 실습 자료와 복습 자료를 함께 제공합니다." },
  { tag: "04", title: "강사 파트너 100+", body: "현장 실무자 출신 강사 100명 이상이 직무·산업 맥락에 맞춰 강의합니다." },
  { tag: "05", title: "데이터 커뮤니티", body: "수료 후에도 부서·조직을 잇는 학습 커뮤니티를 운영해 학습이 일터로 이어지게 합니다." },
];

const company = [
  { dt: "법인명", dd: "케이브레인컴퍼니 (DAEASY 데이터교육 브랜드)" },
  { dt: "대표", dd: "민상일" },
  { dt: "대표번호", dd: "070-5066-0995" },
  { dt: "이메일", dd: "data-edu@kbrainc.com" },
  { dt: "본사", dd: "서울시 동작구 보라매로5길 51 롯데타워 301~309호" },
  { dt: "공개교육장", dd: "서울시 마포구 성암로 189 중소기업DMC타워 701호" },
  { dt: "사업자등록번호", dd: "129-86-50144" },
  { dt: "통신판매업신고", dd: "제2026-서울동작-0124호" },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 pb-16 pt-20 lg:px-10 lg:pb-20 lg:pt-24 anim-page-fade-up">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">About daeasy</p>
          <h1 className="mt-5 text-[44px] font-extrabold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[56px] lg:text-[64px]">
            데이지란?
          </h1>
          <p className="mt-8 max-w-2xl text-[18px] leading-[1.75] text-zinc-700">
            <strong className="text-ink">데이터(DATA)를 쉽고 재미있게(EASY)</strong> 배울 수 있는 맞춤형 교육 플랫폼.
            케이브레인컴퍼니의 데이터교육 브랜드입니다.
          </p>
          <p className="mt-5 max-w-2xl text-[16px] leading-[1.8] text-zinc-600">
            데이터와 AI의 시대에 실무자가 알아야 할 최신 데이터 분석 기법과 실무 적용 가능한 AI 활용 노하우를 제공합니다.
          </p>
          <div className="mt-12 flex items-center gap-5 border-t border-zinc-100 pt-8">
            <Image
              src="/awards/k-digital-brand-award-2026.png"
              alt="2026 K-디지털 브랜드 대상"
              width={270}
              height={269}
              unoptimized
              className="h-24 w-24 shrink-0"
            />
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">Award</p>
              <p className="mt-2 text-[20px] font-extrabold tracking-[-0.015em] text-ink sm:text-[24px]">
                2026 K-디지털 브랜드 대상 수상
              </p>
              <p className="mt-1.5 text-[15px] text-zinc-600">AI · 데이터 교육 부문</p>
              <a
                href={AWARD_ARTICLE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-[13.5px] font-semibold text-accent hover:underline"
              >
                전자신문 보도 보기 →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why daisy */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20 reveal">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="flex justify-center lg:col-span-4 lg:justify-start">
              <Image
                src="/about/daisy.jpg"
                alt="데이지 꽃"
                width={800}
                height={800}
                priority
                unoptimized
                className="h-56 w-56 rounded-full object-cover shadow-[0_12px_40px_rgba(0,0,0,0.12)] sm:h-64 sm:w-64 lg:h-72 lg:w-72"
              />
            </div>
            <div className="lg:col-span-8">
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">Why daisy</p>
              <h2 className="mt-3 text-[32px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[40px]">
                낮의 눈, day&apos;s eye.
              </h2>
              <p className="mt-7 text-[17px] leading-[1.85] text-zinc-700">
                영어로 데이지(daisy)는 <strong className="text-ink">day&apos;s eye</strong> — 해가 뜨면 꽃잎을 열고, 해가 지면 다시 닫는다는 데서 붙은 이름입니다.
              </p>
              <p className="mt-5 text-[16px] leading-[1.85] text-zinc-600">
                데이터와 AI는 매일 새로워집니다. 새 인사이트가 들어올 때마다 다시 펼쳐 들여다보고, 일터로 가져갈 형태로 닫아낸다 — 우리가 전하고 싶은 학습의 리듬입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-24 reveal">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">By the numbers</p>
          <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
            지금까지 함께한 사람들.
          </h2>
          <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-5 reveal-stagger">
            {numbers.map((m) => (
              <div key={m.label}>
                <p className="text-[40px] font-extrabold tracking-[-0.02em] text-ink">{m.stat}</p>
                <p className="mt-2 text-[13px] font-medium text-zinc-500">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28 reveal">
          <div className="max-w-3xl">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">How we work</p>
            <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">
              우리는 이렇게 합니다.
            </h2>
          </div>
          <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 reveal-stagger">
            {values.map((v) => (
              <li key={v.tag} className="rounded-2xl bg-zinc-50/70 p-7">
                <p className="font-mono text-[11.5px] font-bold tracking-[0.18em] text-zinc-500">
                  {v.tag} / Value
                </p>
                <h3 className="mt-5 text-[19px] font-bold tracking-[-0.01em] text-ink">{v.title}</h3>
                <p className="mt-2 text-[14px] leading-[1.7] text-zinc-600">{v.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Company info */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20 reveal">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">Company</p>
          <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
            회사 정보.
          </h2>
          <dl className="mt-10 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 reveal-stagger">
            {company.map((c) => (
              <div key={c.dt}>
                <dt className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">{c.dt}</dt>
                <dd className="mt-2 text-[15px] text-zinc-800">{c.dd}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24 reveal">
          <div className="rounded-3xl bg-ink-warm p-10 text-white sm:p-16 lg:p-20">
            <div className="grid grid-cols-12 gap-x-8 gap-y-8">
              <div className="col-span-12 lg:col-span-8">
                <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">Get in touch</p>
                <h2 className="mt-3 text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-[48px]">
                  누적 10만 명을 교육한 방식으로,<br />조직의 교육을 설계합니다.
                </h2>
              </div>
              <div className="col-span-12 flex self-end lg:col-span-4 lg:justify-end">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-7 py-4 text-[15px] font-bold text-white transition hover:bg-accent/90"
                >
                  교육 문의하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
