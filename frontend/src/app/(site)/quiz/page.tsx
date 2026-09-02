import Link from "next/link";

export const metadata = {
  title: "AI 체험관",
  description:
    "진짜 AI를 직접 겪어보는 체험 스테이션 — 업무 한 줄로 받는 맞춤 AI 리포트부터 시작하세요.",
};

const STATIONS = [
  {
    key: "report",
    badge: "STATION 01",
    title: "내 업무 AI 리포트",
    desc: "담당 업무를 고르면 AI가 자동화 포인트 · 절감 시간 · 보안 주의까지 정리한 맞춤 리포트를 보여드립니다.",
    meta: "약 2분 · 업무 8종",
    href: "/quiz/report",
  },
  {
    key: "vibe-coding",
    badge: "STATION 02",
    title: "바이브 코딩 라이브",
    desc: "만들 화면을 고르면 AI가 쓴 코드와, 그 코드가 실제로 동작하는 웹앱을 함께 보여줍니다.",
    meta: "약 1분 · 화면 8종",
    href: "/quiz/vibe",
  },
  {
    key: "red-team",
    badge: "STATION 03",
    title: "레드팀 게임",
    desc: "가드레일이 걸린 AI 챗봇을 직접 뚫어보며 배우는 보안 감각.",
    meta: "오픈 예정",
    href: null,
  },
] as const;

// 체험 가능한 스테이션만 일러스트를 갖는다 — 예고 줄(red-team)은 대상 아님
const STATION_ILLUST: Partial<Record<(typeof STATIONS)[number]["key"], string>> = {
  report: "/illust/quiz-report.webp",
  "vibe-coding": "/illust/quiz-vibe.webp",
};

export default function ExperienceHubPage() {
  return (
    <section className="bg-zinc-50/40">
      <div className="anim-page-fade-up mx-auto max-w-3xl px-6 py-20 lg:py-24">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          AI 체험관
        </p>
        <h1 className="mt-5 text-[40px] font-extrabold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[48px]">
          공공 AI 실무 감각,
          <br />
          직접 겪어보세요
        </h1>
        <p className="mt-6 text-[17px] leading-[1.75] text-zinc-700">
          설명을 듣는 것과 직접 보는 것은 다릅니다. AI가 실제로 무엇을 해내는지
          체험 스테이션에서 확인해 보세요.
        </p>

        <ul className="mt-12 space-y-4">
          {STATIONS.map((s) => (
            <li key={s.key}>
              {s.href ? (
                <Link
                  href={s.href}
                  className="flex gap-6 rounded-2xl bg-white p-7 ring-1 ring-zinc-200 transition hover:-translate-y-[2px] hover:ring-accent hover:shadow-[0_8px_24px_-12px_rgba(37,99,235,0.35)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                        {s.badge}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-600">
                        {s.meta}
                      </span>
                    </div>
                    <h2 className="mt-3 text-[20px] font-bold leading-[1.35] tracking-[-0.01em] text-ink">
                      {s.title}
                    </h2>
                    <p className="mt-2 text-[14px] leading-[1.65] text-zinc-600">
                      {s.desc}
                    </p>

                    {/* 무엇을 받게 되는지 말로 설명하는 대신 결과물 형태를 그대로 보여준다 */}
                    {s.key === "report" && (
                      <div className="mt-5 overflow-hidden rounded-xl bg-ink px-5 py-4">
                        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/45">
                          결과 예시
                        </p>
                        <p className="mt-1.5 flex items-baseline gap-1.5 text-white">
                          <span className="text-[26px] font-extrabold leading-none tracking-[-0.02em]">
                            주당 12시간
                          </span>
                          <span className="text-[13px] font-semibold text-white/60">
                            절감
                          </span>
                        </p>
                        <p className="mt-1.5 text-[11.5px] text-white/45">
                          자동화 포인트 3가지 · 보안 주의 1가지 · 맞춤 과정 추천
                        </p>
                      </div>
                    )}

                    {s.key === "vibe-coding" && (
                      <div className="mt-5 overflow-hidden rounded-xl ring-1 ring-zinc-200">
                        <div className="flex items-center gap-1.5 bg-zinc-100 px-3 py-2">
                          <span className="h-2 w-2 rounded-full bg-zinc-300" />
                          <span className="h-2 w-2 rounded-full bg-zinc-300" />
                          <span className="h-2 w-2 rounded-full bg-zinc-300" />
                          <span className="ml-2 text-[10.5px] font-semibold text-zinc-500">
                            예산 집행 현황 대시보드
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 bg-white p-3">
                          {[
                            ["전체 예산", "50,000,000원"],
                            ["집행 금액", "12,500,000원"],
                            ["잔액", "37,500,000원"],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="rounded-md border-l-2 border-accent bg-zinc-50 px-2.5 py-2"
                            >
                              <p className="text-[9.5px] text-zinc-500">{label}</p>
                              <p className="mt-0.5 text-[11px] font-bold text-ink">
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <span className="mt-5 inline-block text-[14px] font-bold text-accent">
                      지금 AI 체험하기 →
                    </span>
                  </div>
                  {STATION_ILLUST[s.key] && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={STATION_ILLUST[s.key]}
                      alt=""
                      width={640}
                      height={640}
                      className="hidden h-40 w-40 shrink-0 self-start rounded-xl ring-1 ring-zinc-100 sm:block"
                    />
                  )}
                </Link>
              ) : (
                /* 아직 열지 않은 스테이션 — 체험 가능한 카드와 같은 비중을 주면
                   목록의 3분의 1이 클릭도 안 되는 자리로 낭비된다. 예고 줄로 낮춘다 */
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-dashed border-zinc-300 px-5 py-3.5">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                    {s.badge}
                  </span>
                  <span className="text-[14px] font-bold text-zinc-600">
                    {s.title}
                  </span>
                  <span className="text-[13px] text-zinc-400">{s.desc}</span>
                  <span className="ml-auto text-[12px] font-semibold text-zinc-400">
                    {s.meta}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
