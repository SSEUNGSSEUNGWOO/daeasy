import Image from "next/image";

const OUTPUTS = [
  {
    title: "취약지역 데이터 분석 대시보드",
    description: "지역별 취약도 지표를 비교하고 정책 검토에 활용할 수 있도록 구성한 데이터 분석 화면입니다.",
    image: "/course-outputs/vulnerable-area-dashboard.png",
    alt: "지역별 취약도 지표와 순위를 보여주는 데이터 분석 대시보드",
    url: "https://ydp-insight-hub.lovable.app",
  },
  {
    title: "AI 민원 처리 지원",
    description: "민원 원문을 정리하고 관련 법령을 확인해 답변 초안을 작성하는 업무 흐름을 구현했습니다.",
    image: "/course-outputs/civil-complaint-ai.png",
    alt: "민원 원문과 관련 법령, 답변 작성 영역으로 구성된 AI 민원 처리 지원 화면",
    url: "https://singoai.lovable.app",
  },
  {
    title: "법령 검색·답변 지원",
    description: "업무 질문과 관련된 법령 및 조문을 탐색하고 답변 근거를 확인할 수 있도록 구현했습니다.",
    image: "/course-outputs/legal-search-ai.png",
    alt: "법령 관련 질문과 참고 조문을 함께 보여주는 법령 검색 지원 화면",
    url: "https://lawfind.lovable.app",
  },
] as const;

export function SceneCourseOutputs() {
  return (
    <section className="border-t border-zinc-100 bg-zinc-50/70">
      <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
        <div className="max-w-3xl">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Learning Outcomes
          </p>
          <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">
            교육이 끝나면, 업무에 적용할 결과물이 남습니다.
          </h2>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-[1.75] text-zinc-600">
            실제 교육에서 참가자들이 자신의 업무 아이디어를 기획하고 제작한 프로토타입입니다.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {OUTPUTS.map((output) => (
            <article key={output.title} className="overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200/80">
              <div className="relative aspect-[16/10] border-b border-zinc-100 bg-zinc-100">
                <Image
                  src={output.image}
                  alt={output.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover object-top"
                />
              </div>
              <div className="p-6">
                <h3 className="text-[20px] font-bold tracking-[-0.015em] text-ink">{output.title}</h3>
                <p className="mt-3 text-[14px] leading-[1.7] text-zinc-600">{output.description}</p>
                <a
                  href={output.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/link mt-5 inline-flex items-center gap-2 text-[14px] font-bold text-ink underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  프로토타입 직접 살펴보기
                  <span aria-hidden className="transition-transform group-hover/link:translate-x-0.5">↗</span>
                  <span className="sr-only">(새 탭에서 열림)</span>
                </a>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 text-[12.5px] leading-[1.7] text-zinc-500">
          위 화면은 교육 중 제작된 프로토타입으로, 해당 기관의 공식 행정서비스가 아닙니다.
        </p>
      </div>
    </section>
  );
}
