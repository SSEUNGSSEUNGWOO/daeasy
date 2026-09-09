"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { NUM_FONT, TEAM_COUNT, type TeamTopic } from "./content";

const POLL_MS = 5_000;
const TEAM_NOS = Array.from({ length: TEAM_COUNT }, (_, i) => i + 1);
const pad = (n: number) => String(n).padStart(2, "0");

const FIELD =
  "w-full rounded-2xl border border-slate-200 bg-[#f7f8fd] px-4 py-3.5 text-base text-slate-900 outline-none transition-[box-shadow,border-color,background-color] duration-150 placeholder:text-slate-400 focus:border-[#1f3a93] focus:bg-white focus:ring-4 focus:ring-[#1f3a93]/15";
const LABEL = "text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500";

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
  const [leader, setLeader] = useState("");
  const [members, setMembers] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // 제출 전 확인 단계 — 몇 조에 어떤 내용을 넣는지(덮어쓰기면 기존 내용도) 보여준 뒤 진행
  const [confirming, setConfirming] = useState(false);

  // 하단 고정 바 — 제출 영역이 화면에 들어오면 숨긴다
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
    setConfirming(false);
    const mine = rows.find((r) => r.team_no === n);
    if (mine) {
      setTitle(mine.title);
      setOneLiner(mine.one_liner);
      setLeader(mine.leader);
      setMembers(mine.members);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (teamNo === null) {
      setMsg({ ok: false, text: "조를 먼저 선택해 주세요." });
      return;
    }
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/team-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_no: teamNo, title, one_liner: oneLiner, leader, members }),
      });
      const body = (await res.json()) as { detail?: string };
      if (!res.ok) {
        setMsg({ ok: false, text: body.detail ?? "주제를 제출하지 못했습니다. 잠시 후 다시 시도해 주세요." });
        return;
      }
      setMsg({ ok: true, text: `${teamNo}조 주제를 제출했습니다. 같은 조로 다시 제출하면 기존 내용이 새 내용으로 바뀝니다.` });
      setRows(await fetchRows());
    } catch {
      setMsg({ ok: false, text: "네트워크 연결을 확인한 뒤 다시 제출해 주세요." });
    } finally {
      setBusy(false);
    }
  }

  function scrollToForm() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    formRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  const submittedCount = rows.length;
  const existing = teamNo === null ? undefined : rows.find((r) => r.team_no === teamNo);

  return (
    <>
      <section ref={formRef} id="submit" className="scroll-mt-8 pt-16 sm:pt-20" aria-labelledby="submit-h">
        <div className="grid items-start gap-12 lg:grid-cols-[7fr_5fr] lg:gap-10">
          {/* ── 제출 폼 ── */}
          <div>
            <p style={NUM_FONT} className="text-[11px] font-bold uppercase tracking-[0.28em] text-accent-warm">
              제출
            </p>
            <h2 id="submit-h" className="mt-2 text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
              우리 조 주제 제출
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              조당 1건. 같은 조로 다시 제출하면 기존 내용이 새 내용으로 바뀝니다
            </p>

            <form
              onSubmit={onSubmit}
              className="mt-6 space-y-7 rounded-[28px] border border-[#dde2f3] bg-white p-6 shadow-[0_32px_80px_-32px_rgba(31,58,147,0.28)] sm:p-8"
            >
              <fieldset>
                <legend style={NUM_FONT} className={LABEL}>
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
                            aria-label="주제 제출 완료"
                            className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent-warm"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-[1fr_2fr]">
                <label className="block">
                  <span style={NUM_FONT} className={LABEL}>
                    조장
                  </span>
                  <input
                    className={`${FIELD} mt-3`}
                    value={leader}
                    onChange={(e) => {
                      setLeader(e.target.value);
                      setConfirming(false);
                    }}
                    maxLength={30}
                    placeholder="이름"
                    required
                  />
                </label>
                <label className="block">
                  <span style={NUM_FONT} className={LABEL}>
                    조원
                  </span>
                  <input
                    className={`${FIELD} mt-3`}
                    value={members}
                    onChange={(e) => {
                      setMembers(e.target.value);
                      setConfirming(false);
                    }}
                    maxLength={120}
                    placeholder="이름을 쉼표로 구분 (조장 제외)"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span style={NUM_FONT} className={LABEL}>
                  주제
                </span>
                <input
                  className={`${FIELD} mt-3 text-lg font-semibold`}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setConfirming(false);
                  }}
                  maxLength={100}
                  placeholder="예: 우리 구 청년정책 비교기"
                  required
                />
              </label>

              <label className="block">
                <span style={NUM_FONT} className={LABEL}>
                  누구의 어떤 문제를 해결하나요? (한 문장)
                </span>
                <textarea
                  className={`${FIELD} mt-3 min-h-28 resize-y`}
                  value={oneLiner}
                  onChange={(e) => {
                    setOneLiner(e.target.value);
                    setConfirming(false);
                  }}
                  maxLength={300}
                  placeholder="예: 서울시 자치구의 청년 주거 담당자가 다른 자치구의 정책과 예산을 5분 안에 비교할 수 있게 한다"
                  required
                />
                <span style={NUM_FONT} className="mt-1.5 block text-right text-[11px] tabular-nums text-slate-400">
                  {oneLiner.length} / 최대 300자
                </span>
              </label>

              {msg && (
                <p role="status" className={`text-sm font-semibold ${msg.ok ? "text-accent-warm" : "text-red-600"}`}>
                  {msg.text}
                </p>
              )}

              {confirming && teamNo !== null ? (
                <div role="alertdialog" aria-labelledby="confirm-h" className="rounded-2xl border-2 border-[#1f3a93] bg-[#f7f8fd] p-5 sm:p-6">
                  <p id="confirm-h" className="text-lg font-bold tracking-[-0.02em] text-[#1f3a93]">
                    {existing ? `${teamNo}조의 기존 주제를 새 내용으로 바꿉니다` : `${teamNo}조 주제를 제출합니다`}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">조 번호와 내용이 맞는지 확인해 주세요.</p>
                  <div className={`mt-4 grid gap-3 ${existing ? "sm:grid-cols-2" : ""}`}>
                    {existing && (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-4">
                        <p style={NUM_FONT} className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                          기존 제출 내용 · 마지막 수정 {fmtTime(existing.updated_at)}
                        </p>
                        <p className="mt-2 font-bold text-slate-400 line-through decoration-slate-300">{existing.title}</p>
                        <p className="mt-1 text-sm text-slate-400">{existing.one_liner}</p>
                        <p className="mt-2 text-xs text-slate-400">조장 {existing.leader} · 조원 {existing.members}</p>
                      </div>
                    )}
                    <div className="rounded-xl border border-[#dde2f3] bg-white p-4">
                      <p style={NUM_FONT} className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent-warm">
                        {existing ? "새 내용" : "제출 내용"}
                      </p>
                      <p className="mt-2 font-bold text-[#1f3a93]">{title}</p>
                      <p className="mt-1 text-sm text-slate-600">{oneLiner}</p>
                      <p className="mt-2 text-xs text-slate-500">조장 {leader} · 조원 {members}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_2fr]">
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      className="rounded-2xl border border-[#dde2f3] bg-white py-3.5 text-base font-bold text-slate-600 transition-transform duration-150 active:scale-[0.98]"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-2xl bg-accent-warm py-3.5 text-base font-bold text-white shadow-[0_12px_30px_-12px_rgba(249,115,22,0.8)] transition-[transform,filter] duration-150 hover:brightness-95 active:scale-[0.98] disabled:opacity-50"
                    >
                      {busy ? "제출 중…" : existing ? `${teamNo}조 내용 바꾸고 제출` : `${teamNo}조 주제 제출`}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-2xl bg-accent-warm py-4 text-base font-bold text-white shadow-[0_12px_30px_-12px_rgba(249,115,22,0.8)] transition-[transform,filter] duration-150 hover:brightness-95 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                >
                  제출 내용 확인
                </button>
              )}
            </form>
          </div>

          {/* ── 조별 현황 (옆에서 보면서 적는다) ── */}
          <aside aria-labelledby="status-h" className="lg:sticky lg:top-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p style={NUM_FONT} className="text-[11px] font-bold uppercase tracking-[0.28em] text-accent-warm">
                  현황
                </p>
                <h2 id="status-h" className="mt-2 text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
                  조별 주제 현황
                </h2>
              </div>
              <p style={NUM_FONT} className="pb-1 text-sm font-bold tabular-nums text-slate-600">
                <span className="text-3xl text-[#1f3a93]">{submittedCount}</span> / {TEAM_COUNT}조 제출
              </p>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              다른 조의 주제를 보고 되도록 겹치지 않게 정해 주세요. 5초마다 자동 갱신됩니다.
            </p>

            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {TEAM_NOS.map((n) => {
                const r = rows.find((x) => x.team_no === n);
                if (!r) {
                  return (
                    <li
                      key={n}
                      className="flex items-center justify-between rounded-2xl border border-dashed border-[#c9d1ec] bg-[#f7f8fd] px-5 py-3.5"
                    >
                      <span style={NUM_FONT} className="text-2xl font-extrabold tracking-[-0.04em] text-slate-300">
                        {pad(n)}
                      </span>
                      <span className="text-xs text-slate-400">미제출</span>
                    </li>
                  );
                }
                return (
                  <li
                    key={`${n}-${r.updated_at}`}
                    className="anim-page-fade-up relative overflow-hidden rounded-2xl border border-[#dde2f3] bg-white px-5 py-4 pl-6 shadow-[0_14px_32px_-22px_rgba(31,58,147,0.35)]"
                  >
                    <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-accent-warm" />
                    <div className="flex items-baseline justify-between gap-3">
                      <span style={NUM_FONT} className="text-2xl font-extrabold tracking-[-0.04em] text-[#1f3a93]">
                        {pad(n)}
                      </span>
                      <span style={NUM_FONT} className="text-[11px] font-semibold tracking-[0.08em] text-slate-400">
                        {fmtTime(r.updated_at)}
                      </span>
                    </div>
                    <p className="mt-1.5 font-bold leading-snug tracking-[-0.01em]">{r.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{r.one_liner}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      <span className="font-semibold text-slate-500">조장</span> {r.leader} · <span className="font-semibold text-slate-500">조원</span> {r.members}
                    </p>
                  </li>
                );
              })}
            </ul>
            {loadError && (
              <p className="mt-4 text-sm text-red-600">
                조별 주제 현황을 불러오지 못했습니다. 잠시 후 자동으로 다시 불러옵니다.
              </p>
            )}
          </aside>
        </div>
      </section>

      {/* ── 하단 고정 바: 제출 영역이 안 보일 때(예시·5단계 읽는 중) 돌아갈 길 ── */}
      <div
        aria-hidden={formVisible}
        className={`fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-[#1f3a93]/85 text-white backdrop-blur-xl backdrop-saturate-150 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
          formVisible ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <p style={NUM_FONT} className="text-sm tabular-nums text-white/65">
            <span className="text-xl font-extrabold text-white">{submittedCount}</span> / {TEAM_COUNT}조 제출
          </p>
          <a
            href="#submit"
            onClick={(e) => {
              e.preventDefault();
              scrollToForm();
            }}
            className="rounded-full bg-accent-warm px-5 py-2.5 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97]"
          >
            우리 조 주제 입력하기
          </a>
        </div>
      </div>
    </>
  );
}
