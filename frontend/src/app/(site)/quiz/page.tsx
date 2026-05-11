import Link from "next/link";

export const metadata = { title: "교육 추천" };

export default function QuizPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20 lg:py-24">
      <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">Recommend</p>
      <h1 className="mt-5 text-[40px] font-extrabold leading-[1.06] tracking-[-0.025em] text-[#0F0F0F] sm:text-[48px]">
        내게 맞는 교육 찾기
      </h1>
      <p className="mt-6 text-[17px] leading-[1.75] text-zinc-700">
        몇 가지 질문에 답하면, 직무·수준·목표에 맞는 교육과정을 추천해 드립니다.
      </p>
      <p className="mt-3 text-[15px] leading-[1.7] text-zinc-500">
        문제풀이·설문 기반 추천은 곧 공개됩니다. 지금은{" "}
        <Link href="/contact" className="font-semibold text-[#0F0F0F] underline-offset-4 hover:underline">
          교육 문의
        </Link>
        를 통해 직접 상담받으실 수 있습니다.
      </p>
    </section>
  );
}
