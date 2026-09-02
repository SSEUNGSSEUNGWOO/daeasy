import Link from "next/link";

/** 로그인해야 볼 수 있는 자리에 놓는 안내 카드.
 *  next: 로그인 성공 후 복귀할 내부 경로 */
export function LoginGate({ next, message }: { next: string; message: string }) {
  const loginHref = `/login?next=${encodeURIComponent(next)}`;
  return (
    <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-zinc-200 sm:p-10">
      <span
        aria-hidden
        className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent/10 text-accent"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 fill-none stroke-current stroke-2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </span>
      <p className="mt-5 text-[16px] font-bold leading-[1.5] text-ink">{message}</p>
      <p className="mt-2 text-[13.5px] leading-[1.7] text-zinc-500">
        회원가입은 1분이면 끝나고, 무료입니다.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href={loginHref}
          className="inline-flex items-center justify-center rounded-md bg-ink px-6 py-3 text-[14px] font-bold text-white transition hover:bg-ink-hover"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-6 py-3 text-[14px] font-bold text-ink transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          회원가입
        </Link>
      </div>
    </div>
  );
}
