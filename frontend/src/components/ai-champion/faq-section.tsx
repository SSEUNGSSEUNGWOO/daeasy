import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { DATABUS_URL } from "@/lib/site";

/* 서치콘솔에서 잡히는 세부 검색어("행안부 ai 챔피언", "ai 챔피언 종합 교육과정",
   "ai 챔피언 역량 인증", "ai 챔피언 교육")를 질문 제목이 그대로 받도록 쓴다.
   사실은 행안부·NIA 학습지원시스템(databus.kr) 의 AI 챔피언 소개·모집 공지 기준 —
   연도가 붙은 수치는 해마다 바뀌니 공지가 새로 뜨면 같이 고친다.
   같은 문답을 FAQPage JSON-LD 로 내보내 검색 결과에 접이식 답변이 붙게 한다. */

const FAQ = [
  {
    q: "행정안전부(행안부) AI 챔피언이란 무엇인가요?",
    a: "행정안전부가 행정·공공기관 직원을 대상으로 운영하는 AI 활용 실무 인증 제도입니다. 지식을 묻는 시험이 아니라, 생성형 AI·데이터 분석·서비스 구현을 실제 과제로 수행하는 수행평가로 문제해결 역량을 인증합니다. 한국지능정보사회진흥원(NIA)이 운영하며, 2025년부터 2030년까지 약 2만 명 양성을 목표로 합니다.",
  },
  {
    q: "AI 챔피언 등급은 어떻게 나뉘나요?",
    a: "Green·Blue·Black 세 등급입니다. Green(AI 융합 실무자)은 노코드 도구로 AI 전환 아이디어를 기획안으로 구체화하는 실무자, Blue(AI 전환 실행자)는 개발·모델링으로 PoC부터 구축까지 이끄는 IT 담당자를 인증합니다. Black(거점 리더)은 2026년 신설된 최상위 등급으로, AI 챔피언 고급과정 인증자에게 부여되며 기관의 AI 전환과 동료 코칭·확산을 이끄는 역할입니다.",
  },
  {
    q: "AI 챔피언 종합 교육과정은 어떻게 진행되나요?",
    a: "문제해결형 실습 중심으로 약 2.5주(총 12일) 동안 비대면으로 진행됩니다. 과정 안내 1일, 트랙별 지정 3과목 이러닝 5일, 데이터분석·생성형 AI·바이브코딩 집중수업 3일, 기술 멘토가 지원하는 셀프스터디 약 2일을 거쳐 마지막 날 과제수행평가를 치릅니다. 신청 전에 선수과목인 「AI 리터러시와 업무활용」과 「데이터 리터러시」 2과목을 먼저 이수해야 합니다.",
  },
  {
    q: "AI 챔피언 역량 인증은 어떻게 받나요?",
    a: "인증 방식은 세 가지입니다. 교육과정형은 종합과정을 수강하고 수행평가로 인증받습니다. 자기주도형은 민간교육이나 자기주도학습으로 역량을 갖춘 사람이 종합과정 없이 수행평가만 치릅니다. 자격연계형은 AICE Associate·ADP·빅데이터분석기사 중 하나를 보유하고 행안부 지정 과목 1개 이상을 이수하면 Blue 등급이 부여됩니다. 수행평가는 생성형 AI 활용·데이터 분석·서비스 구현 각 30점으로 구성되며, 합산 75점 이상이면 인증됩니다. 미인증 시 월별 정기평가 일정 안에서 재응시할 수 있습니다.",
  },
  {
    q: "AI 챔피언 그린(초급)과 블루(중급), 어느 쪽을 골라야 하나요?",
    a: "둘 다 생성형 AI 활용·데이터 분석·서비스 구현 3개 분야를 수행평가로 봅니다. 그린은 노코드 기반으로 정책·업무 개선 아이디어를 실무에 적용하는 데 초점을 두어 사전 지식 없이도 참여할 수 있습니다. 블루는 Python·머신러닝을 활용한 분석·개발·구현에 초점을 두어 IT 담당자에게 맞고, 기초 프로그래밍 이해가 있으면 수월합니다. 두 등급을 순차적으로 모두 취득하는 것도 가능합니다.",
  },
  {
    q: "누가 신청할 수 있고, 어디서 신청하나요?",
    a: "중앙행정기관·지방자치단체·공공기관에서 근무하는 직원이면 직무 분야와 관계없이 신청할 수 있습니다. 신청은 행안부·NIA 역량강화 학습지원시스템(databus.kr)의 수강신청 메뉴에서 합니다. 매월 모집 공지가 올라오며, 종합과정과 자기주도형 수행평가 모두 선수과목 2과목 이수가 신청 조건입니다. 수행평가 4시간은 교육파견으로 복무 처리할 수 있습니다. 기관 단위 교육 설계나 운영 상담은 데이지에 문의하시면 됩니다.",
  },
  {
    q: "인증평가는 어떤 환경에서 치르나요?",
    a: "비대면 실시간 CBT 방식으로, 웹캠 모니터링 아래 약 4시간(환경준비 2시간, 문제풀이 2시간) 동안 진행됩니다. 상용 AI 도구는 자유롭게 쓸 수 있지만 메일·SNS 등 외부와 소통하는 행위는 금지됩니다. 안정적인 유선 인터넷 환경이 권장되며, 무선 사용 중 발생한 오류는 응시자 책임입니다.",
  },
  {
    q: "데이지(DAEASY)는 AI 챔피언에서 어떤 역할을 하나요?",
    a: "데이지는 2025년 시범사업부터 AI 챔피언의 역량진단 모델과 평가 지표를 개발하고, 종합과정 운영과 학습·과제 지원, CBT 기반 인증평가, 채점·심사와 결과 관리를 맡아 왔습니다. 2026년에도 종합과정과 인증평가 운영을 이어가고 있습니다.",
  },
] as const;

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export function FaqSection() {
  return (
    <section className="border-t border-zinc-100 bg-white">
      <JsonLd id="ai-champion-faq-ld" data={FAQ_LD} />
      <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28 reveal">
        <div className="max-w-3xl">
          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">자주 묻는 질문</p>
          <h2 className="mt-3 text-[34px] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[46px]">
            행안부 AI 챔피언 교육·인증,<br />궁금한 점을 정리했습니다.
          </h2>
        </div>
        <div className="mt-12 divide-y divide-zinc-200 border-y border-zinc-200">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group py-6">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 [&::-webkit-details-marker]:hidden">
                <h3 className="text-[18px] font-bold leading-[1.4] text-ink sm:text-[20px]">{q}</h3>
                <span
                  aria-hidden
                  className="mt-1 shrink-0 text-[22px] leading-none text-zinc-400 transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-3xl text-[16px] leading-[1.8] text-zinc-600">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-[15px] leading-[1.7] text-zinc-700">
          수행평가가 어떤 식인지 궁금하다면{" "}
          <Link href="/quiz/champion" className="font-bold text-accent underline underline-offset-4">
            연습 문제 3개를 직접 풀어보세요
          </Link>
          . AI 도구를 써도 되는 실제 평가 방식 그대로입니다.
        </p>
        <p className="mt-3 text-[14px] leading-[1.7] text-zinc-500">
          모집 일정과 신청은{" "}
          <a href={DATABUS_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-ink underline underline-offset-4">
            행안부·NIA 학습지원시스템(databus.kr)
          </a>
          의 공지사항을 기준으로 합니다.
        </p>
      </div>
    </section>
  );
}
