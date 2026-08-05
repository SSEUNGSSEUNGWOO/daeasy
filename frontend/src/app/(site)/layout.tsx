import { RevealAuto } from "@/components/reveal-auto";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SmoothScroll } from "@/components/smooth-scroll";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <RevealAuto />
    </SmoothScroll>
  );
}
