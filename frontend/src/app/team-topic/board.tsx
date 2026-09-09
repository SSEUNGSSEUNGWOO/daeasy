"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { TEAM_COUNT, type TeamTopic } from "./content";

const POLL_MS = 15_000;
const TEAM_NOS = Array.from({ length: TEAM_COUNT }, (_, i) => i + 1);

const FIELD =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base text-ink outline-none transition-[box-shadow,border-color] duration-150 placeholder:text-neutral-400 focus:border-accent focus:ring-4 focus:ring-accent/15";

async function fetchRows(): Promise<TeamTopic[]> {
  const res = await fetch("/api/team-topic", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as TeamTopic[];
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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

  const submittedCount = rows.length;

  return (
    <>
      {/* 조별 현황 */}
      <section className="mt-20" aria-labelledby="status-h">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="status-h" className="text-2xl font-bold tracking-[-0.02em]">
            조별 주제 현황
          </h2>
          <p className="text-sm tabular-nums text-neutral-500">
            {submittedCount} / {TEAM_COUNT}조 제출
          </p>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          다른 조와 되도록 겹치지 않게 — 여기서 확인하고 적어주세요. 15초마다 갱신됩니다.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {TEAM_NOS.map((n) => {
            const r = rows.find((x) => x.team_no === n);
            return (
              <li
                key={n}
                className={`rounded-2xl border p-5 ${
                  r
                    ? "border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    : "border-dashed border-neutral-300 bg-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    {n}조
                  </span>
                  {r && (
                    <span className="text-xs tabular-nums text-neutral-400">
                      {r.submitted_by} · {fmtTime(r.updated_at)}
                    </span>
                  )}
                </div>
                {r ? (
                  <>
                    <p className="mt-2 text-lg font-bold leading-snug tracking-[-0.01em]">{r.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">{r.one_liner}</p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-neutral-400">아직 제출 전</p>
                )}
              </li>
            );
          })}
        </ul>
        {loadError && (
          <p className="mt-3 text-sm text-red-600">
            현황을 불러오지 못했습니다 ({loadError}). 잠시 후 자동으로 다시 시도합니다.
          </p>
        )}
      </section>

      {/* 제출 */}
      <section ref={formRef} id="submit" className="mt-20 scroll-mt-10" aria-labelledby="submit-h">
        <h2 id="submit-h" className="text-2xl font-bold tracking-[-0.02em]">
          우리 조 주제 제출
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          조당 1건. 같은 조로 다시 제출하면 덮어씁니다.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-6 space-y-6 rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-8"
        >
          <fieldset>
            <legend className="text-sm font-semibold">조</legend>
            <div role="radiogroup" aria-label="조 선택" className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
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
                    className={`relative rounded-xl py-3 text-base font-semibold tabular-nums transition-[transform,background-color,color] duration-150 active:scale-[0.96] ${
                      selected
                        ? "bg-ink text-white"
                        : "bg-neutral-100 text-ink hover:bg-neutral-200"
                    }`}
                  >
                    {n}
                    {done && (
                      <span
                        aria-label="제출됨"
                        className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${selected ? "bg-white" : "bg-accent"}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-sm font-semibold">주제</span>
            <input
              className={`${FIELD} mt-2`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="예: 우리 구 청년정책 비교기"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">누구의 어떤 문제를 푸는가</span>
            <textarea
              className={`${FIELD} mt-2 min-h-24 resize-y`}
              value={oneLiner}
              onChange={(e) => setOneLiner(e.target.value)}
              maxLength={300}
              placeholder="예: 서울시 청년 주거 담당자가 옆 자치구 정책과 예산을 5분 안에 비교하게 한다"
              required
            />
            <span className="mt-1 block text-right text-xs tabular-nums text-neutral-400">
              {oneLiner.length} / 300
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-semibold">제출자</span>
            <input
              className={`${FIELD} mt-2`}
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
              maxLength={50}
              placeholder="이름"
              required
            />
          </label>

          {msg && (
            <p role="status" className={`text-sm font-medium ${msg.ok ? "text-accent" : "text-red-600"}`}>
              {msg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-ink py-3.5 text-base font-semibold text-white transition-[transform,opacity] duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {busy ? "저장 중…" : "제출"}
          </button>
        </form>
      </section>

      {/* 하단 고정 바 — 반투명 재질, 폼이 보이면 숨김 */}
      <div
        aria-hidden={formVisible}
        className={`fixed inset-x-0 bottom-0 z-10 border-t border-white/40 bg-white/70 backdrop-blur-xl backdrop-saturate-150 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
          formVisible ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <p className="text-sm text-neutral-600">
            <span className="font-semibold tabular-nums text-ink">{submittedCount}</span> / {TEAM_COUNT}조 제출
          </p>
          <a
            href="#submit"
            onClick={(e) => {
              e.preventDefault();
              const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              formRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
            }}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-150 active:scale-[0.97]"
          >
            우리 조 주제 제출하기
          </a>
        </div>
      </div>
    </>
  );
}
