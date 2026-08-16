import Image from "next/image";
import Link from "next/link";

import { RentalForm } from "./rental-form";
import { BookingCalendar } from "./booking-calendar";
import { fetchPublicBookings } from "@/lib/rental-bookings";

// 어드민이 등록한 예약 현황이 재배포 없이 반영되도록
export const revalidate = 60;

export const metadata = {
  title: "강의실 대관",
  description:
    "공항철도 DMC역 지하통로 이용 가능한 단독 대관 교육장. 137.82㎡(약 41.69평) 공간, 최대 48명, 빔프로젝터·마이크·기가 인터넷 완비.",
};

const spaceFeatures = [
  "DMC역과 지하통로로 연결된 초역세권의 깔끔한 강의실입니다.",
  "세미나, 워크샵, 강연, 간담회 등 다양한 목적에 따라 이용하실 수 있습니다.",
  "137.82㎡(약 41.69평)의 공간",
  "이동식 책상으로 테이블 24개 자유 배치 가능",
];

const spaceCapacity = [
  { dt: "이용 가능 인원", dd: "40명 (최대 48명까지 가능)" },
  { dt: "진행 가능 행사", dd: "강의, 세미나, 카페 동호회 모임, 스터디 모임" },
];

const facilities = [
  {
    tag: "01",
    title: "좌석",
    body: "테이블 24개 · 의자 48개. 강의식 최대 40명(운영자석 제외), T자형 최대 36명.",
  },
  {
    tag: "02",
    title: "강의 장비",
    body: "빔프로젝터, 스크린, 마이크, 스피커, HDMI 케이블 일체 제공.",
  },
  {
    tag: "03",
    title: "네트워크",
    body: "1Giga 인터넷 / 와이파이 사용 가능.",
  },
  {
    tag: "04",
    title: "주차",
    body: "주차 유료 / 최초 30분 제외 10분 당 500원.",
  },
];

const notices = [
  "이용 날짜 / 시간 / 인원 확인 후 예약해주세요.",
  "전화 응대 가능 시간은 평일 10시 ~ 18시 입니다.",
  "입실은 이용시간 30분 전부터 가능합니다. 다음 대관을 위해 반드시 이용시간을 지켜주세요.",
  "강의 전 30분 이상의 준비시간이 필요한 경우 1시간 추가로 요청해주세요.",
  "소음이 크게 발생하는 모임은 이용이 어렵습니다.",
  "음료와 간단한 간식 반입 가능. 기타 음식 반입 시 반드시 사전 협의 부탁드립니다.",
  "노트북 등 개인 장비를 지참해주세요.",
];

const refundPolicy = [
  { period: "이용 8일 전", rate: "총 금액의 100% 환불" },
  { period: "이용 5일 전", rate: "총 금액의 50% 환불" },
  { period: "이용 2일 전", rate: "총 금액의 30% 환불" },
  { period: "이용 1일 전", rate: "환불 불가" },
];

const gallery = [
  { src: "/rentals/space-1.jpg", alt: "DMC타워 교육장 강의식 배치" },
  { src: "/rentals/space-2.jpg", alt: "DMC타워 교육장 정면 화이트보드" },
  { src: "/rentals/space-3.jpg", alt: "DMC타워 교육장 후면 시점" },
  { src: "/rentals/space-4.jpg", alt: "DMC타워 교육장 책상 배치" },
];

export default async function RentalsPage() {
  const bookings = await fetchPublicBookings();
  return (
    <>
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 pb-16 pt-20 lg:px-10 lg:pb-20 lg:pt-24 anim-page-fade-up">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            강의실 대관
          </p>
          <h1 className="mt-5 text-[44px] font-extrabold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[56px] lg:text-[64px]">
            DMC타워 교육장
          </h1>
          <p className="mt-8 max-w-2xl text-[18px] leading-[1.75] text-zinc-700">
            <strong className="text-ink">공항철도 DMC역 지하통로</strong>로 바로 연결되는 단독 대관 교육장.
          </p>
          <p className="mt-5 max-w-2xl text-[16px] leading-[1.8] text-zinc-600">
            세미나·워크샵·강연·간담회 등 다양한 목적에 맞게 이용하실 수 있습니다.
          </p>
          <div className="mt-12 overflow-hidden rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
            <Image
              src="/rentals/space-1.jpg"
              alt="DMC타워 교육장 전경"
              width={1920}
              height={1440}
              priority
              unoptimized
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 공간 소개 */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                공간 안내
              </p>
              <h2 className="mt-3 text-[32px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[40px]">
                공간 소개.
              </h2>
              <ul className="mt-8 space-y-4 text-[16px] leading-[1.75] text-zinc-700">
                {spaceFeatures.map((f) => (
                  <li key={f} className="flex gap-3">
                    <span aria-hidden className="mt-[10px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-10 grid grid-cols-1 gap-6 border-t border-zinc-200 pt-8 sm:grid-cols-2">
                {spaceCapacity.map((c) => (
                  <div key={c.dt}>
                    <dt className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                      {c.dt}
                    </dt>
                    <dd className="mt-2 text-[15px] text-zinc-800">{c.dd}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.10)]">
                <Image
                  src="/rentals/space-2.jpg"
                  alt="DMC타워 교육장 정면 시점"
                  width={1920}
                  height={1440}
                  unoptimized
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 갤러리 */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            공간 사진
          </p>
          <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
            현장 사진.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 reveal-stagger">
            {gallery.map((g) => (
              <div key={g.src} className="overflow-hidden rounded-2xl">
                <Image
                  src={g.src}
                  alt={g.alt}
                  width={1920}
                  height={1440}
                  unoptimized
                  className="h-auto w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 시설 안내 */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              시설·장비
            </p>
            <h2 className="mt-3 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">
              시설 안내.
            </h2>
          </div>
          <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 reveal-stagger">
            {facilities.map((f) => (
              <li key={f.tag} className="rounded-2xl bg-white p-7 ring-1 ring-zinc-100">
                <p className="font-mono text-[11.5px] font-bold tracking-[0.18em] text-zinc-500">
                  {f.tag} / Facility
                </p>
                <h3 className="mt-5 text-[19px] font-bold tracking-[-0.01em] text-ink">
                  {f.title}
                </h3>
                <p className="mt-2 text-[14px] leading-[1.7] text-zinc-600">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 유의사항 */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                이용 안내
              </p>
              <h2 className="mt-3 text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[36px]">
                유의사항.
              </h2>
              <p className="mt-6 text-[15px] leading-[1.8] text-zinc-600">
                예약 전 아래 사항을 확인해주세요.
              </p>
            </div>
            <ol className="lg:col-span-8 space-y-5 reveal-stagger">
              {notices.map((n, i) => (
                <li key={n} className="flex gap-5 border-b border-zinc-100 pb-5 last:border-b-0">
                  <span className="font-mono text-[13px] font-bold text-zinc-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="flex-1 text-[15px] leading-[1.75] text-zinc-700">{n}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 환불 정책 */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            환불 규정
          </p>
          <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
            환불 정책.
          </h2>
          <p className="mt-6 max-w-2xl text-[15px] leading-[1.8] text-zinc-700">
            <strong className="text-ink">결제 후 2시간 이내에는 100% 환불 가능합니다.</strong>{" "}
            (단, 이용시간 전까지만 가능)
          </p>
          <div className="mt-10 overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-100">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                  <th className="px-6 py-4">기간</th>
                  <th className="px-6 py-4">환불율</th>
                </tr>
              </thead>
              <tbody className="text-[15px] text-zinc-800">
                {refundPolicy.map((r) => (
                  <tr key={r.period} className="border-b border-zinc-100 last:border-b-0">
                    <td className="px-6 py-4 font-medium">{r.period}</td>
                    <td className="px-6 py-4">{r.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 예약 현황 */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-24">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            예약 현황
          </p>
          <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
            예약 현황.
          </h2>
          <div className="mt-10 max-w-3xl">
            <BookingCalendar bookings={bookings} />
          </div>
        </div>
      </section>

      {/* 신청 폼 */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                대관 문의
              </p>
              <h2 className="mt-3 text-[32px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[40px]">
                대관 신청.
              </h2>
              <p className="mt-7 text-[16px] leading-[1.85] text-zinc-700">
                폼을 제출하시면 담당자가 영업일 기준 1일 이내로 연락드립니다.
                급하신 경우 아래 연락처로 직접 문의해주세요.
              </p>
              <div className="mt-8 space-y-3">
                <a
                  href="tel:070-5066-0995"
                  className="flex items-baseline gap-3 text-[15px] text-zinc-800 hover:text-ink"
                >
                  <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    전화
                  </span>
                  <span className="font-medium">070-5066-0995</span>
                </a>
                <a
                  href="mailto:data-edu@kbrainc.com"
                  className="flex items-baseline gap-3 text-[15px] text-zinc-800 hover:text-ink"
                >
                  <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    메일
                  </span>
                  <span className="font-medium">data-edu@kbrainc.com</span>
                </a>
              </div>
            </div>
            <RentalForm />
          </div>
        </div>
      </section>

      {/* 위치 / 연락처 */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            오시는 길
          </p>
          <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
            오시는 길.
          </h2>
          <dl className="mt-10 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 reveal-stagger">
            <div>
              <dt className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                주소
              </dt>
              <dd className="mt-2 text-[15px] leading-[1.7] text-zinc-800">
                서울시 마포구 성암로 189<br />중소기업DMC타워 701호
              </dd>
            </div>
            <div>
              <dt className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                교통
              </dt>
              <dd className="mt-2 text-[15px] leading-[1.7] text-zinc-800">
                디지털미디어시티역(공항철도/6호선/경의중앙선) 8번 출구<br />지하통로로 DMC타워 7층 직접 연결
              </dd>
            </div>
            <div>
              <dt className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                대표번호
              </dt>
              <dd className="mt-2 text-[15px] text-zinc-800">070-5066-0995</dd>
            </div>
            <div>
              <dt className="text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                메일
              </dt>
              <dd className="mt-2 text-[15px] text-zinc-800">data-edu@kbrainc.com</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="rounded-3xl bg-ink-warm p-10 text-white sm:p-16 lg:p-20">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-8">
              <div className="lg:col-span-8">
                <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent-soft">
                  대관 신청
                </p>
                <h2 className="mt-3 text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-[48px]">
                  강의실 대관,<br />일정 확인부터 도와드립니다.
                </h2>
              </div>
              <div className="flex self-end lg:col-span-4 lg:justify-end">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-7 py-4 text-[15px] font-bold text-white transition hover:bg-accent/90"
                >
                  문의하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
