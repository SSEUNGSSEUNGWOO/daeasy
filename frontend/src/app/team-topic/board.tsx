"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { NUM_FONT, TEAM_COUNT, type TeamTopic } from "./content";

const POLL_MS = 15_000;
const TEAM_NOS = Array.from({ length: TEAM_COUNT }, (_, i) => i + 1);
const pad = (n: number) => String(n).padStart(2, "0");

const FIELD =
  "w-full rounded-2xl border border-slate-200 bg-[#f7f8fd] px-4 py-3.5 text-base text-slate-900 outline-none transition-[box-shadow,border-color,background-color] duration-150 placeholder:text-slate-400 focus:border-[#1f3a93] focus:bg-white focus:ring-4 focus:ring-[#1f3a93]/15";

async function fetchRows(): Promise<TeamTopic[]> {
  const res = await fetch("/api/team-topic", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as TeamTopic[];
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TeamTopicBoard() {
  const [rows, setRows] = useState<TeamTopic[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [teamNo, setTeamNo] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // 하단 고정 바 — 폼이 화면에 들어오면 숨긴다
  const formRef = useRef<HTMLElement>(null);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    let active = true;
    const tick = () =>
      fetchRows()
        .then((r) => {
          if (!active) return;
          setRows(r);
          setLoadError(null);
        })
        .catch((err: unknown) => {
          if (active) setLoadError(err instanceof Error ? err.message : "load failed");
        });
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setFormVisible(e?.isIntersecting ?? false), {
      threshold: 0.2,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 조를 고르면 그 조의 기존 제출을 폼에 채운다 (재제출 = 덮어쓰기)
  function pickTeam(n: number) {
    setTeamNo(n);
    setMsg(null);
    const mine = rows.find((r) => r.team_no === n);
    if (mine) {
      setTitle(mine.title);
      setOneLiner(mine.one_liner);
      setSubmittedBy(mine.submitted_by);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (teamNo === null) {
      setMsg({ ok: false, text: "조를 먼저 골라주세요." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/team-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_no: teamNo, title, one_liner: oneLiner, submitted_by: submittedBy }),
      });
      const body = (await res.json()) as { detail?: string };
      if (!res.ok) {
        setMsg({ ok: false, text: body.detail ?? "저장에 실패했습니다." });
        return;
      }
      setMsg({ ok: true, text: `${teamNo}조 제출 완료. 같은 조로 다시 제출하면 덮어씁니다.` });
      setRows(await fetchRows());
    } catch {
      setMsg({ ok: false, text: "네트워크 오류. 다시 시도해주세요." });
    } finally {
      setBusy(false);
    }
  }

  function scrollToForm() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    formRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  const submittedCount = rows.length;

  return (
    <>
      {/* ── 03 조별 현황 ── */}
      <section className="pt-20 sm:pt-28" aria-labelledby="status-h">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex items-end gap-5">
            <span
              style={NUM_FONT}
              className="text-5xl font-extrabold leading-none tracking-[-0.04em] text-accent-warm sm:text-6xl"
            >
              03
            </span>
            <div className="pb-1">
              <h2 id="status-h" className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
                조별 주제 현황
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                다른 조와 되도록 겹치지 않게 — 여기서 확인하고 적어주세요. 15초마다 갱신
              </p>
            </div>
          </div>
          <p style={NUM_FONT} className="pb-1 text-sm font-bold tabular-nums text-slate-600">
            <span className="text-3xl text-[#1f3a93]">{submittedCount}</span> / {TEAM_COUNT}
          </p>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {TEAM_NOS.map((n) => {
            const r = rows.find((x) => x.team_no === n);
            if (!r) {
              return (
                <li
                  key={n}
                  className="flex min-h-36 items-start justify-between rounded-3xl border border-dashed border-[#c9d1ec] bg-[#f7f8fd] p-6"
                >
                  <span
                    style={NUM_FONT}
                    className="text-4xl font-extrabold tracking-[-0.04em] text-slate-300"
                  >
                    {pad(n)}
                  </span>
                  <span className="text-xs text-slate-400">아직 제출 전</span>
                </li>
              );
            }
            return (
              <li
                key={`${n}-${r.updated_at}`}
                className="anim-page-fade-up relative min-h-36 overflow-hidden rounded-3xl border border-[#dde2f3] bg-white p-6 shadow-[0_18px_40px_-24px_rgba(31,58,147,0.28)] transition-transform duration-300 ease-out hover:-translate-y-0.5 motion-reduce:transition-none"
              >
                <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-accent-warm" />
                <div className="flex items-start justify-between gap-4">
                  <span
                    style={NUM_FONT}
                    className="text-4xl font-extrabold tracking-[-0.04em] text-[#1f3a93]"
                  >
                    {pad(n)}
                  </span>
                  <span
                    style={NUM_FONT}
                    className="mt-1 text-[11px] font-semibold tracking-[0.08em] text-slate-400"
                  >
                    {r.submitted_by} · {fmtTime(r.updated_at)}
                  </span>
                </div>
                <p className="mt-3 text-xl font-bold leading-snug tracking-[-0.02em]">{r.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.one_liner}</p>
              </li>
            );
          })}
        </ul>
        {loadError && (
          <p className="mt-4 text-sm text-red-600">
            현황을 불러오지 못했습니다 ({loadError}). 잠시 후 자동으로 다시 시도합니다.
          </p>
        )}
      </section>

      {/* ── 04 제출 ── */}
      <section ref={formRef} id="submit" className="scroll-mt-8 pt-20 sm:pt-28" aria-labelledby="submit-h">
        <div className="flex items-end gap-5">
          <span
            style={NUM_FONT}
            className="text-5xl font-extrabold leading-none tracking-[-0.04em] text-accent-warm sm:text-6xl"
          >
            04
          </span>
          <div className="pb-1">
            <h2 id="submit-h" className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
              우리 조 주제 제출
            </h2>
            <p className="mt-1 text-sm text-slate-500">조당 1건. 같은 조로 다시 제출하면 덮어씁니다</p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-10 space-y-7 rounded-[28px] border border-[#dde2f3] bg-white p-6 shadow-[0_32px_80px_-32px_rgba(31,58,147,0.28)] sm:p-10"
        >
          <fieldset>
            <legend style={NUM_FONT} className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
              조
            </legend>
            <div role="radiogroup" aria-label="조 선택" className="mt-4 grid grid-cols-4 gap-2.5 sm:grid-cols-8">
              {TEAM_NOS.map((n) => {
                const selected = teamNo === n;
                const done = rows.some((r) => r.team_no === n);
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => pickTeam(n)}
                    style={NUM_FONT}
                    className={`relative aspect-square rounded-2xl text-xl font-extrabold tabular-nums transition-[transform,background-color,color,box-shadow] duration-150 active:scale-[0.94] ${
                      selected
                        ? "bg-[#1f3a93] text-white shadow-[0_0_0_3px_#f97316]"
                        : "bg-[#eef1fb] text-[#1f3a93] hover:bg-[#dfe4f7]"
                    }`}
                  >
                    {pad(n)}
                    {done && (
                      <span
                        aria-label="제출됨"
                        className={`absolute right-2 top-2 h-1.5 w-1.5 rounded-full ${selected ? "bg-accent-warm" : "bg-accent-warm"}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span style={NUM_FONT} className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
              주제
            </span>
            <input
              className={`${FIELD} mt-3 text-lg font-semibold`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="예: 우리 구 청년정책 비교기"
              required
            />
          </label>

          <label className="block">
            <span style={NUM_FONT} className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
              누구의 어떤 문제를 푸는가
            </span>
            <textarea
              className={`${FIELD} mt-3 min-h-28 resize-y`}
              value={oneLiner}
              onChange={(e) => setOneLiner(e.target.value)}
              maxLength={300}
              placeholder="예: 서울시 청년 주거 담당자가 옆 자치구 정책과 예산을 5분 안에 비교하게 한다"
              required
            />
            <span style={NUM_FONT} className="mt-1.5 block text-right text-[11px] tabular-nums text-slate-400">
              {oneLiner.length} / 300
            </span>
          </label>

          <label className="block">
            <span style={NUM_FONT} className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
              제출자
            </span>
            <input
              className={`${FIELD} mt-3`}
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
              maxLength={50}
              placeholder="이름"
              required
            />
          </label>

          {msg && (
            <p role="status" className={`text-sm font-semibold ${msg.ok ? "text-accent-warm" : "text-red-600"}`}>
              {msg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-accent-warm py-4 text-base font-bold text-white shadow-[0_12px_30px_-12px_rgba(249,115,22,0.8)] transition-[transform,filter] duration-150 hover:brightness-95 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {busy ? "저장 중…" : "제출"}
          </button>
        </form>
      </section>

      {/* ── 하단 고정 바: 다크 반투명 재질, 폼이 보이면 숨김 ── */}
      <div
        aria-hidden={formVisible}
        className={`fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-[#1f3a93]/85 text-white backdrop-blur-xl backdrop-saturate-150 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
          formVisible ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <p style={NUM_FONT} className="text-sm tabular-nums text-white/65">
            <span className="text-xl font-extrabold text-white">{submittedCount}</span> / {TEAM_COUNT} 제출
          </p>
          <a
            href="#submit"
            onClick={(e) => {
              e.preventDefault();
              scrollToForm();
            }}
            className="rounded-full bg-accent-warm px-5 py-2.5 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97]"
          >
            우리 조 주제 제출하기
          </a>
        </div>
      </div>
    </>
  );
}
