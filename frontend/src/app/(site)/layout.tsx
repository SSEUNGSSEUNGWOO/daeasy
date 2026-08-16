import { RevealAuto } from "@/components/reveal-auto";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// Lenis 관성 스크롤(SmoothScroll)은 제거했다 — 히어로 영상 + 스크롤 연출이 겹쳐
// 스크롤이 무겁게 느껴졌다. 네이티브 스크롤을 그대로 쓴다.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <RevealAuto />
    </>
  );
}
