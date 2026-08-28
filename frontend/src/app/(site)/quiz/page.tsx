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
    desc: "업무를 한 줄만 적으면 AI가 자동화 포인트 · 절감 시간 · 보안 주의까지 맞춤 리포트를 실시간으로 써 드립니다.",
    meta: "약 2분 · 입력 1줄",
    href: "/quiz/report",
  },
  {
    key: "vibe-coding",
    badge: "STATION 02",
    title: "바이브 코딩 라이브",
    desc: "말 한마디로 실제 동작하는 웹앱이 눈앞에서 만들어지는 체험.",
    meta: "오픈 예정",
    href: null,
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
          설명을 듣는 것과 직접 겪는 것은 다릅니다. 진짜 AI가 실시간으로
          움직이는 체험 스테이션에서 확인해 보세요.
        </p>

        <ul className="mt-12 space-y-4">
          {STATIONS.map((s) => (
            <li key={s.key}>
              {s.href ? (
                <Link
                  href={s.href}
                  className="block rounded-2xl bg-white p-7 ring-1 ring-zinc-200 transition hover:-translate-y-[2px] hover:ring-accent hover:shadow-[0_8px_24px_-12px_rgba(37,99,235,0.35)]"
                >
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
                  <span className="mt-4 inline-block text-[14px] font-bold text-accent">
                    지금 체험하기 →
                  </span>
                </Link>
              ) : (
                <div className="rounded-2xl bg-white/60 p-7 ring-1 ring-zinc-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                      {s.badge}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-500">
                      {s.meta}
                    </span>
                  </div>
                  <h2 className="mt-3 text-[20px] font-bold leading-[1.35] tracking-[-0.01em] text-zinc-500">
                    {s.title}
                  </h2>
                  <p className="mt-2 text-[14px] leading-[1.65] text-zinc-500">
                    {s.desc}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
