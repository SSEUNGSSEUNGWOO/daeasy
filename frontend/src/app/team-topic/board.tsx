"use client";

import { useEffect, useState, type FormEvent } from "react";

import { NEW_TOPIC_CODE, TEAM_COUNT, TOPICS, type TeamTopic } from "./content";

const POLL_MS = 15_000;
const TEAM_NOS = Array.from({ length: TEAM_COUNT }, (_, i) => i + 1);

function teamsOn(rows: TeamTopic[], code: string): number[] {
  return rows.filter((r) => r.topic_code === code).map((r) => r.team_no);
}

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

  const [teamNo, setTeamNo] = useState("");
  const [topicCode, setTopicCode] = useState("");
  const [title, setTitle] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

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

  // 조 번호를 고르면 그 조의 기존 제출을 폼에 채운다 (재제출 = 덮어쓰기)
  function pickTeam(v: string) {
    setTeamNo(v);
    setMsg(null);
    const mine = rows.find((r) => String(r.team_no) === v);
    if (mine) {
      setTopicCode(mine.topic_code);
      setTitle(mine.topic_code === NEW_TOPIC_CODE ? mine.title : "");
      setOneLiner(mine.one_liner);
      setSubmittedBy(mine.submitted_by);
    }
  }

  const isNew = topicCode === NEW_TOPIC_CODE;
  const others = topicCode && !isNew
    ? teamsOn(rows, topicCode).filter((n) => String(n) !== teamNo)
    : [];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/team-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_no: Number(teamNo),
          topic_code: topicCode,
          title,
          one_liner: oneLiner,
          submitted_by: submittedBy,
        }),
      });
      const body = (await res.json()) as { detail?: string };
      if (!res.ok) {
        setMsg({ ok: false, text: body.detail ?? "저장에 실패했습니다." });
        return;
      }
      setMsg({ ok: true, text: `${teamNo}조 제출 완료. 수정하려면 같은 조 번호로 다시 제출하면 됩니다.` });
      setRows(await fetchRows());
    } catch {
      setMsg({ ok: false, text: "네트워크 오류. 다시 시도해주세요." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="topics-wrap">
        <div className="sec-head">
          <h2>
            범정부 AI 서비스 <em>주제 예시 10선</em>
          </h2>
          <div className="sub">국민 맞춤 서비스부터 정책 분석까지 — 하나 고르거나, 같은 프레임으로 새 주제 제안</div>
        </div>
        <div className="topics">
          {TOPICS.map((t) => {
            const taken = teamsOn(rows, t.code);
            return (
              <div className={`topic${t.hi ? " hi" : ""}`} key={t.code}>
                <div className="cap">
                  <span className="code">{t.code}</span>
                  <span className="ic">{t.icon}</span>
                  {taken.length > 0 && (
                    <span className="taken">{taken.map((n) => `${n}조`).join(" · ")}</span>
                  )}
                </div>
                <h3>{t.title}</h3>
                <div className="tag">{t.tag}</div>
                <div className="q">{t.q}</div>
                <div className="src">
                  <span className="lbl">DATA</span>
                  <ul>
                    {t.data.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="submit" id="submit">
        <div className="sec-head">
          <h2>
            조별 주제 방향 <em>제출</em>
          </h2>
          <div className="sub">
            조당 1건 · 같은 조 번호로 다시 제출하면 덮어씁니다 · 되도록 다른 조와 겹치지 않게
          </div>
        </div>
        <div className="submit-grid">
          <form className="form" onSubmit={onSubmit}>
            <label>
              조 번호
              <select value={teamNo} onChange={(e) => pickTeam(e.target.value)} required>
                <option value="">선택</option>
                {TEAM_NOS.map((n) => (
                  <option key={n} value={n}>
                    {n}조{rows.some((r) => r.team_no === n) ? " (제출됨)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              주제
              <select
                value={topicCode}
                onChange={(e) => {
                  setTopicCode(e.target.value);
                  setMsg(null);
                }}
                required
              >
                <option value="">선택</option>
                {TOPICS.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.code}. {t.title}
                  </option>
                ))}
                <option value={NEW_TOPIC_CODE}>새 주제 제안</option>
              </select>
            </label>
            {others.length > 0 && (
              <div className="warn">
                이미 {others.map((n) => `${n}조`).join(", ")}가 이 주제를 골랐습니다. 되도록 다른
                주제를 권장하지만, 대상·데이터가 확실히 다르면 제출해도 됩니다.
              </div>
            )}
            {isNew && (
              <label>
                새 주제 제목
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="예: 지역 축제 효과 검증기"
                  required
                />
              </label>
            )}
            <label>
              누구의 어떤 문제를 푸는가 (한 문장)
              <textarea
                value={oneLiner}
                onChange={(e) => setOneLiner(e.target.value)}
                maxLength={300}
                placeholder="예: 서울시 청년 주거 담당자가 옆 자치구 정책과 예산을 5분 안에 비교하게 한다"
                required
              />
            </label>
            <label>
              제출자
              <input
                value={submittedBy}
                onChange={(e) => setSubmittedBy(e.target.value)}
                maxLength={50}
                placeholder="이름"
                required
              />
            </label>
            {msg && <div className={msg.ok ? "ok" : "warn"}>{msg.text}</div>}
            <button type="submit" disabled={busy}>
              {busy ? "저장 중…" : "제출"}
            </button>
          </form>

          <div className="board">
            <table>
              <thead>
                <tr>
                  <th>조</th>
                  <th>주제</th>
                  <th>누구의 어떤 문제</th>
                  <th>제출</th>
                </tr>
              </thead>
              <tbody>
                {TEAM_NOS.map((n) => {
                  const r = rows.find((x) => x.team_no === n);
                  if (!r) {
                    return (
                      <tr key={n}>
                        <td className="n">{n}조</td>
                        <td className="empty" colSpan={3}>
                          미제출
                        </td>
                      </tr>
                    );
                  }
                  const dupWith = teamsOn(rows, r.topic_code).filter((m) => m !== n);
                  return (
                    <tr key={n}>
                      <td className="n">{n}조</td>
                      <td>
                        <span className={`code${r.topic_code === NEW_TOPIC_CODE ? " new" : ""}`}>
                          {r.topic_code === NEW_TOPIC_CODE ? "NEW" : r.topic_code}
                        </span>
                        {r.title}
                        {r.topic_code !== NEW_TOPIC_CODE && dupWith.length > 0 && (
                          <span className="dup">
                            {dupWith.map((m) => `${m}조`).join("·")}와 겹침
                          </span>
                        )}
                      </td>
                      <td>{r.one_liner}</td>
                      <td className="meta">
                        {r.submitted_by}
                        <br />
                        {fmtTime(r.updated_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {loadError && (
              <div className="warn" style={{ margin: 10 }}>
                현황을 불러오지 못했습니다 ({loadError}). 잠시 후 자동으로 다시 시도합니다.
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
