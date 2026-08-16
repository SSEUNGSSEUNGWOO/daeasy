/* 커버 이미지가 없는 인사이트용 타이포 폴백.
   외부 스톡 대신 브랜드 톤(ink-warm + accent-soft)과 첫 태그로 채운다. */

export function InsightCoverFallback({ tag }: { tag?: string }) {
  return (
    <div aria-hidden className="flex h-full w-full flex-col justify-between bg-ink-warm p-6">
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-soft">
        Daeasy Insight
      </span>
      <p className="line-clamp-2 text-[26px] font-extrabold leading-[1.15] tracking-[-0.02em] text-white/85">
        {tag ?? "AI · Data"}
      </p>
    </div>
  );
}
