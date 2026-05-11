export const metadata = { title: "교육 후기" };

export default function CasesPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">Reviews</p>
      <h1 className="mt-3 text-[40px] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#0F0F0F] sm:text-[48px]">
        교육 후기
      </h1>
      <p className="mt-4 text-[16px] leading-[1.7] text-zinc-600">
        진행한 교육의 실제 후기와 측정한 성과. 곧 공개됩니다.
      </p>
    </section>
  );
}
