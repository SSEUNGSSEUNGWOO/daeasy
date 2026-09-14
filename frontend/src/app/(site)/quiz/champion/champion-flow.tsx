"use client";

import { useState } from "react";
import Link from "next/link";

import { ShareButton } from "@/components/share-button";

import {
  ANSWERS,
  GRANT_ROWS,
  GRANT_TYPES,
  MEETING_NOTES,
  PASS_LINE,
  POINTS_PER_PROBLEM,
} from "./problems";

type Verdict = "correct" | "wrong";
type Results = { q1?: Verdict; q2?: Verdict; q3?: Verdict };

const AREAS = ["생성형 AI 활용", "데이터 분석", "서비스 구현"] as const;

const btnPrimary =
  "inline-flex items-center justify-center rounded-md bg-accent px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-accent/90 disabled:bg-zinc-300";
const btnSecondary =
  "inline-flex items-center justify-center rounded-md border border-zinc-300 px-5 py-2.5 text-[14px] font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50";
const inputCls =
  "rounded-md border border-zinc-300 px-3 py-2 text-[15px] text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

function VerdictNote({ verdict, children }: { verdict: Verdict; children: React.ReactNode }) {
  const ok = verdict === "correct";
  return (
    <div
      role="status"
      className={`mt-4 rounded-xl px-5 py-4 text-[14px] leading-[1.7] ${ok ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}
    >
      <p className="font-bold">{ok ? "정답입니다. +30점" : "아쉽지만 오답입니다."}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function ChampionFlow() {
  const [started, setStarted] = useState(false);
  const [results, setResults] = useState<Results>({});
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");

  const answered = [results.q1, results.q2, results.q3].filter(Boolean).length;
  const correct = [results.q1, results.q2, results.q3].filter((v) => v === "correct").length;
  const score = correct * POINTS_PER_PROBLEM;
  const done = answered === 3;

  function restart() {
    setResults({});
    setQ1("");
    setQ2("");
    setQ3("");
    setStarted(false);
  }

  if (!started) {
    return (
      <div className="mt-10 rounded-2xl bg-white p-7 ring-1 ring-zinc-200 sm:p-9">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">진행 방식</p>
        <ul className="mt-4 space-y-2 text-[15px] leading-[1.7] text-zinc-700">
          <li>· 생성형 AI 활용 · 데이터 분석 · 서비스 구현 영역에서 1문항씩, 총 3문항입니다.</li>
          <li>
            · 문항당 {POINTS_PER_PROBLEM}점, 통과선은 실제 인증 기준과 같은 {PASS_LINE}점입니다.
          </li>
          <li className="font-bold text-ink">
            · ChatGPT · Gemini 같은 AI 도구를 자유롭게 써도 됩니다. 실제 수행평가도 그렇습니다.
          </li>
        </ul>
        <p className="mt-5 text-[13px] leading-[1.7] text-zinc-500">
          운영사 데이지가 실제 평가 형식을 축소해 만든 연습 문제입니다. 실제 출제 문항이 아니며,
          실제 평가는 문항마다 보고서·노트북·배포 URL 같은 제출물이 함께 요구됩니다.
        </p>
        <button type="button" onClick={() => setStarted(true)} className={`${btnPrimary} mt-7`}>
          체험 시작
        </button>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-8">
      {/* 문항 1 — 생성형 AI 활용 */}
      <section className="rounded-2xl bg-white p-7 ring-1 ring-zinc-200 sm:p-9">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-accent">문항 1 · {AREAS[0]} · 30점</p>
        <h2 className="mt-3 text-[20px] font-bold leading-[1.4] text-ink">
          4개 부서 회의록에서 후속조치 마감일이 2026년 6월인 항목은 모두 몇 건입니까?
        </h2>
        <p className="mt-3 text-[14px] leading-[1.7] text-zinc-600">
          당신은 OO시 기획조정실 주무관입니다. 부서별 5월 월간회의록 「Ⅲ. 후속조치」 부분을
          발췌했습니다. 날짜 표기가 제각각인 점에 주의하세요. 실제 평가에서는 PDF 50개가 든 ZIP 을
          받아 AI 로 처리합니다.
        </p>
        <div className="mt-5 space-y-3 rounded-xl bg-zinc-50 p-5 text-[13.5px] leading-[1.7] text-zinc-800">
          {MEETING_NOTES.map((note) => (
            <div key={note.dept}>
              <p className="font-bold">[{note.dept}] Ⅲ. 후속조치</p>
              <ol className="ml-4 list-decimal">
                {note.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <form
          className="mt-5 flex flex-wrap items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setResults((r) => ({ ...r, q1: Number(q1) === ANSWERS.followUpJune ? "correct" : "wrong" }));
          }}
        >
          <label className="text-[14px] font-semibold text-zinc-700" htmlFor="q1">
            6월 마감 건수
          </label>
          <input
            id="q1"
            type="number"
            min={0}
            inputMode="numeric"
            value={q1}
            onChange={(e) => setQ1(e.target.value)}
            disabled={!!results.q1}
            className={`${inputCls} w-24`}
            required
          />
          <span className="text-[14px] text-zinc-500">건</span>
          <button type="submit" disabled={!!results.q1 || q1 === ""} className={btnPrimary}>
            제출
          </button>
        </form>
        {results.q1 && (
          <VerdictNote verdict={results.q1}>
            정답은 {ANSWERS.followUpJune}건입니다. 성과지표 수정안(6/12), 민원 응대 매뉴얼(6/5),
            만족도 조사 보고(6/30), 서버 교체 견적(06/19). 「5. 29.」「6월 5일」「06/19」처럼 흩어진
            표기를 한 형식으로 정규화한 뒤 세는 것이 이 유형의 핵심입니다.
          </VerdictNote>
        )}
      </section>

      {/* 문항 2 — 데이터 분석 */}
      <section className="rounded-2xl bg-white p-7 ring-1 ring-zinc-200 sm:p-9">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-accent">문항 2 · {AREAS[1]} · 30점</p>
        <h2 className="mt-3 text-[20px] font-bold leading-[1.4] text-ink">
          사업유형별 1인당 평균 지원금액이 가장 높은 유형은 무엇입니까?
        </h2>
        <p className="mt-3 text-[14px] leading-[1.7] text-zinc-600">
          당신은 청년정책과 주무관입니다. 아래는 청년고용 지원 사업 집행 자료입니다.
          <strong className="text-ink"> 결측값(-1)과 이상치(0)가 있는 행은 제외</strong>하고,
          유형별 총 지원금액 ÷ 총 수혜자 수로 계산하세요. 표를 복사해 AI 나 스프레드시트에
          넣어도 됩니다.
        </p>
        <div className="mt-5 overflow-x-auto rounded-xl bg-zinc-50 p-3">
          <table className="w-full text-[13.5px] text-zinc-800">
            <thead>
              <tr className="text-left text-[12px] uppercase tracking-[0.08em] text-zinc-500">
                <th className="px-2 py-1.5">연도</th>
                <th className="px-2 py-1.5">사업유형</th>
                <th className="px-2 py-1.5 text-right">지원금액(만원)</th>
                <th className="px-2 py-1.5 text-right">수혜자 수(명)</th>
              </tr>
            </thead>
            <tbody>
              {GRANT_ROWS.map(([year, type, amount, people]) => (
                <tr key={`${year}-${type}`} className="border-t border-zinc-200">
                  <td className="px-2 py-1.5">{year}</td>
                  <td className="px-2 py-1.5">{type}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{amount.toLocaleString()}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{people.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form
          className="mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            setResults((r) => ({ ...r, q2: q2 === ANSWERS.topGrantType ? "correct" : "wrong" }));
          }}
        >
          <fieldset disabled={!!results.q2} className="flex flex-wrap gap-3">
            <legend className="sr-only">사업유형 선택</legend>
            {GRANT_TYPES.map((t) => (
              <label
                key={t}
                className={`cursor-pointer rounded-md border px-4 py-2 text-[14px] font-semibold transition ${q2 === t ? "border-accent bg-accent/10 text-accent" : "border-zinc-300 text-zinc-700 hover:border-zinc-400"}`}
              >
                <input
                  type="radio"
                  name="q2"
                  value={t}
                  checked={q2 === t}
                  onChange={() => setQ2(t)}
                  className="sr-only"
                />
                {t}
              </label>
            ))}
          </fieldset>
          <button type="submit" disabled={!!results.q2 || q2 === ""} className={`${btnPrimary} mt-4`}>
            제출
          </button>
        </form>
        {results.q2 && (
          <VerdictNote verdict={results.q2}>
            정답은 {ANSWERS.topGrantType}입니다. 정제 후 창업자금 200만원, 주거비지원 50만원,
            청년인턴 약 38만원, 취업교육 약 10만원. 창업자금의 「0원 / 400명」 이상치 행을 빼지 않으면
            평균이 40만원으로 떨어져 주거비지원이 1위로 뒤집힙니다. 정제 규칙을 먼저 세우는 이유입니다.
          </VerdictNote>
        )}
      </section>

      {/* 문항 3 — 서비스 구현 */}
      <section className="rounded-2xl bg-white p-7 ring-1 ring-zinc-200 sm:p-9">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-accent">문항 3 · {AREAS[2]} · 30점</p>
        <h2 className="mt-3 text-[20px] font-bold leading-[1.4] text-ink">
          접수일 2026-05-13(수), 건의민원(10영업일)의 회신 기한은 언제입니까?
        </h2>
        <p className="mt-3 text-[14px] leading-[1.7] text-zinc-600">
          민원 회신기한을 자동 산정하는 웹 도구를 만들기 전에 규칙을 검증하는 테스트 케이스입니다.
          규칙: 접수일 다음 영업일부터 1일로 세고, 토·일은 영업일에서 제외합니다(공휴일은 고려하지
          않음). 실제 평가에서는 이 규칙을 HTML/JS 로 구현해 배포한 공개 URL 을 제출하고, 채점자가
          입력 3건을 넣어 확인합니다.
        </p>
        <form
          className="mt-5 flex flex-wrap items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setResults((r) => ({ ...r, q3: q3 === ANSWERS.replyDeadline ? "correct" : "wrong" }));
          }}
        >
          <label className="text-[14px] font-semibold text-zinc-700" htmlFor="q3">
            회신 기한
          </label>
          <input
            id="q3"
            type="date"
            value={q3}
            onChange={(e) => setQ3(e.target.value)}
            disabled={!!results.q3}
            className={inputCls}
            required
          />
          <button type="submit" disabled={!!results.q3 || q3 === ""} className={btnPrimary}>
            제출
          </button>
        </form>
        {results.q3 && (
          <VerdictNote verdict={results.q3}>
            정답은 2026년 5월 27일(수)입니다. 5/14(1) 15(2) 18(3) 19(4) 20(5) 21(6) 22(7) 25(8)
            26(9) 27(10). 주말을 건너뛰는 규칙을 코드로 옮길 때 접수일 포함 여부에서 하루가 어긋나기
            쉬우니, 이런 테스트 케이스를 먼저 정해두고 만드는 것이 빠릅니다.
          </VerdictNote>
        )}
      </section>

      {done && (
        <section className="rounded-2xl bg-ink p-7 text-white sm:p-9">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-blue-300">체험 결과</p>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-[44px] font-extrabold leading-none tracking-[-0.02em]">{score}점</span>
            <span className="text-[14px] font-semibold text-white/60">/ 통과선 {PASS_LINE}점</span>
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-white/80">
            {score >= PASS_LINE
              ? "세 영역을 모두 통과했습니다. 실제 평가에서는 여기에 보고서·노트북·배포 URL 제출이 더해지고, 자료는 훨씬 큽니다. 준비된 분입니다."
              : correct === 2
                ? "한 문항 차이로 통과선에 못 미쳤습니다. 실제 평가도 한 영역이 비면 75점을 넘기 어렵습니다. 아래 약한 영역을 종합과정에서 집중적으로 다룹니다."
                : "아직은 감을 잡는 단계입니다. 종합과정은 이러닝 5일과 집중수업 3일, 멘토가 붙는 셀프스터디로 이 세 영역을 순서대로 익히도록 짜여 있습니다."}
          </p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-3">
            {AREAS.map((area, i) => {
              const v = [results.q1, results.q2, results.q3][i];
              return (
                <li key={area} className="rounded-lg bg-white/10 px-4 py-3">
                  <p className="text-[12px] text-white/50">{area}</p>
                  <p className="mt-0.5 text-[16px] font-bold">{v === "correct" ? "30점" : "0점"}</p>
                </li>
              );
            })}
          </ul>
          <p className="mt-5 text-[12px] leading-[1.6] text-white/45">
            실제 인증은 수행평가 90% 에 이러닝 학습 점수 10% 를 더해 75점 이상이면 통과입니다.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/contact" className={btnPrimary}>
              AI 챔피언 교육 문의하기
            </Link>
            <Link href="/ai-champion" className={`${btnSecondary} border-white/30 text-white hover:border-white/60 hover:bg-white/10`}>
              인증 제도 자세히 보기
            </Link>
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-6">
        <button
          type="button"
          onClick={restart}
          className="text-[14px] font-semibold text-zinc-500 underline-offset-4 hover:text-ink hover:underline"
        >
          다시 풀기
        </button>
        {done && (
          <ShareButton
            text="AI 챔피언 수행평가는 이런 문제가 나옵니다. AI 도구를 써서 직접 풀어보세요"
            className="text-[14px] font-semibold text-zinc-500 underline-offset-4 hover:text-ink hover:underline"
          />
        )}
      </div>
    </div>
  );
}
