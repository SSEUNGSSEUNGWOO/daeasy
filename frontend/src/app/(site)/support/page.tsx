import Link from "next/link";
import { FaqAccordion } from "./faq-accordion";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata = { title: "고객센터" };

type Faq = { category: string; q: string; a: React.ReactNode };

const faqs: Faq[] = [
  {
    category: "환불",
    q: "환불 규정은 어떻게 되나요?",
    a: (
      <>
        <p>예약 이후 교육 수강 취소를 희망하는 경우, 본 환불 규정에 따라 적용됩니다.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>폐강: 100% 환불</li>
          <li>10일 전: 100% 환불</li>
          <li>7일 전: 수강료 전체 50% 환불</li>
          <li>6일 전: 수강료 전체 30% 환불</li>
          <li>5일 전: 환불 불가</li>
        </ul>
        <p className="mt-3 text-zinc-500">
          ※ 본 교육과정은 업무일 기준 개강 14일 전 개강 여부를 확정하며, 최소 수강생이 모이지 않을 경우 폐강될 수 있습니다.
        </p>
      </>
    ),
  },
  {
    category: "교육상담",
    q: "나에게 맞는 교육 상담 및 추천을 받고 싶습니다.",
    a: (
      <>
        <p>두 가지 방법으로 상담을 받을 수 있습니다.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            빠른 상담신청:{" "}
            <Link href="/contact" className="font-semibold underline-offset-4 hover:underline">
              교육 문의 페이지
            </Link>
          </li>
          <li>이메일 {CONTACT_EMAIL}</li>
        </ul>
      </>
    ),
  },
  {
    category: "교육상담",
    q: "우리 기업/기관에서 교육을 받고 싶은데 어떻게 해야 하나요?",
    a: (
      <>
        <p>
          기업·기관에서 직접 교육하는 과정의 경우, 상시 상담을 통해 커리큘럼을 구성해 드립니다. 아래 문의처로 연락 주시면 빠르게 안내해 드립니다.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            빠른 상담신청:{" "}
            <Link href="/contact" className="font-semibold underline-offset-4 hover:underline">
              교육 문의 페이지
            </Link>
          </li>
          <li>이메일 {CONTACT_EMAIL}</li>
        </ul>
      </>
    ),
  },
  {
    category: "교육신청",
    q: "교육 신청은 어떻게 진행되나요?",
    a: (
      <>
        <p>
          DAEASY 홈페이지 가입자는 교육 개설이 확정되면 뉴스레터를 받게 되며, 해당 뉴스레터의 스케줄에 맞춰 공개과정 신청 페이지에서 교육 신청을 진행하면 됩니다.
        </p>
        <p className="mt-3">신청 완료 후 일주일 이내에 개/폐강 여부가 결정되고, 폐강 시에는 전액 환불됩니다.</p>
      </>
    ),
  },
  {
    category: "교육 신청·수강",
    q: "비전공자도 교육을 수강해도 되나요?",
    a: (
      <>
        <p>네, 가능합니다.</p>
        <p className="mt-3">
          컴퓨터공학 관련 전공자뿐 아니라 비전공자도 함께 들을 수 있는 커리큘럼으로 구성되어 있으며, 초급부터 고급까지 스텝업할 수 있는 교육들로 이루어져 있습니다.
        </p>
        <p className="mt-3">비전공자라도 수료하려는 의지만 충분하다면 수강 완료가 가능합니다.</p>
      </>
    ),
  },
  {
    category: "교육진행",
    q: "개/폐강 여부는 언제 결정되나요?",
    a: <p>개/폐강 여부는 교육 신청 마감 후 일주일 이내에 결정되며, 폐강이 확정될 경우 100% 환불됩니다.</p>,
  },
  {
    category: "교육 전",
    q: "입과 안내 메일은 어떻게 받게 되나요?",
    a: (
      <>
        <p>공개과정 신청 시 입력하신 메일을 기준으로 입과 안내 메일을 발송해 드립니다.</p>
        <p className="mt-3">입과 안내 메일에는 다음 정보가 포함됩니다.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>교육명</li>
          <li>일시</li>
          <li>수료기준</li>
          <li>준비사항</li>
          <li>장소</li>
          <li>주차안내</li>
          <li>문의처</li>
        </ul>
      </>
    ),
  },
  {
    category: "교육 후",
    q: "교육 수료증 발급은 어떻게 되나요?",
    a: <p>교육 종료 후 일주일 이내에 수료증이 발급되며, 발급된 수료증은 각자 개인 메일로 발송해 드립니다.</p>,
  },
];

export default function SupportPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 pb-12 pt-20 lg:px-10 lg:pb-16 lg:pt-24 anim-page-fade-up">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">고객센터</p>
          <h1 className="mt-5 text-[44px] font-extrabold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[56px] lg:text-[64px]">
            고객센터
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-[1.75] text-zinc-700">
            공지사항과 자주 묻는 질문(FAQ). 더 자세한 문의는{" "}
            <Link href="/contact" className="font-bold text-ink underline-offset-4 hover:underline">
              교육 문의
            </Link>
            로 보내주세요.
          </p>
        </div>
      </section>

      {/* Notice */}
      <section className="border-t border-zinc-100 bg-zinc-50/70">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20 reveal">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">공지</p>
          <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
            공지사항.
          </h2>
          <p className="mt-6 text-[15px] leading-[1.7] text-zinc-600">
            등록된 공지가 없습니다. 곧 첫 공지가 올라갑니다.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20 reveal">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-zinc-500">FAQ</p>
          <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">
            자주 묻는 질문.
          </h2>
          <FaqAccordion items={faqs} />
        </div>
      </section>
    </>
  );
}
