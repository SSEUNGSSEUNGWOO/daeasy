import { ChampionFlow } from "./champion-flow";

export const metadata = {
  title: "AI 챔피언 수행평가 체험",
  description:
    "행정안전부 AI 챔피언 역량인증 수행평가는 어떤 문제가 나올까요? 생성형 AI 활용·데이터 분석·서비스 구현 연습 문제 3개를 AI 도구를 써가며 직접 풀어보세요.",
};

export default function ChampionStationPage() {
  return (
    <section className="bg-zinc-50/40">
      <div className="mx-auto max-w-3xl px-6 py-20 lg:py-24">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          AI 체험관 · STATION 04
        </p>
        <h1 className="mt-5 text-[40px] font-extrabold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[48px]">
          AI 챔피언 수행평가 체험
        </h1>
        <p className="mt-6 text-[17px] leading-[1.75] text-zinc-700">
          행안부 AI 챔피언 인증은 지식을 묻는 시험이 아니라 AI 를 켜놓고 실무 과제를
          푸는 수행평가입니다. 같은 형식의 연습 문제 3개를 직접 풀어보세요.
        </p>

        <ChampionFlow />
      </div>
    </section>
  );
}
