"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  mobile?: boolean;
  onNavigate?: () => void;
};

export function CustomerNav({ mobile = false, onNavigate }: Props) {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((res) => res.json() as Promise<{ customer: { name: string } | null }>)
      .then((body) => {
        if (active) setName(body.customer?.name ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setName(null);
    onNavigate?.();
    router.push("/");
    router.refresh();
  }

  if (!loaded) return <div className={mobile ? "h-[97px]" : "hidden h-9 w-32 md:block"} />;

  const linkClass = mobile
    ? "border-b border-zinc-100 py-3.5 text-[15px] font-medium text-zinc-700"
    : "px-2 py-2 text-[13px] font-medium text-zinc-600 transition hover:text-ink";

  if (name) {
    return (
      <div className={mobile ? "flex flex-col" : "hidden items-center md:flex"}>
        <Link href="/mypage" onClick={onNavigate} className={linkClass}>
          {name}님
        </Link>
        <button type="button" onClick={logout} className={`${linkClass} text-left`}>
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className={mobile ? "flex flex-col" : "hidden items-center md:flex"}>
      <Link href="/login" onClick={onNavigate} className={linkClass}>로그인</Link>
      <Link href="/signup" onClick={onNavigate} className={linkClass}>회원가입</Link>
    </div>
  );
}
