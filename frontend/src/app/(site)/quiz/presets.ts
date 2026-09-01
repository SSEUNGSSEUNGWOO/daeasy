/**
 * AI 체험관 선택지.
 *
 * 방문자는 자유 입력 대신 여기서 고른다. `work` 는 모델에 보내는 문장이자
 * 미리 생성해둔 응답(`public/experience/*-canned.json`)의 키다 — 문구를 바꾸면
 * 저장된 응답과 어긋나므로 `node scripts/gen-canned.mjs` 로 다시 생성해야 한다.
 */
export type Preset = {
  /** 버튼 상단의 분류 라벨 */
  category: string;
  /** 모델 입력 = canned 응답 키 */
  work: string;
};

/** 스테이션 ① 내 업무 AI 리포트 — 공공기관 직무별 */
export const REPORT_PRESETS: Preset[] = [
  { category: "민원", work: "구청에서 주민 민원 응대를 담당합니다" },
  { category: "홍보", work: "보도자료와 홍보 콘텐츠를 작성합니다" },
  { category: "예산", work: "보조금 예산 편성과 정산을 담당합니다" },
  { category: "기획", work: "사업 계획서와 결과 보고서를 작성합니다" },
  { category: "인허가", work: "인허가 신청 서류를 검토하고 심사합니다" },
  { category: "데이터", work: "각종 행정 통계를 수집하고 분석합니다" },
  { category: "행사", work: "주민 대상 행사와 교육을 기획하고 운영합니다" },
  { category: "인사·총무", work: "인사 관리와 부서 총무 업무를 담당합니다" },
];

/** 스테이션 ② 바이브 코딩 라이브 — 실무에서 바로 쓸 법한 화면 */
export const VIBE_PRESETS: Preset[] = [
  { category: "신청", work: "부서 비품 신청 페이지" },
  { category: "예약", work: "회의실 예약 현황판" },
  { category: "민원", work: "민원 접수 폼" },
  { category: "설문", work: "행사 참가 신청 폼" },
  { category: "대시보드", work: "예산 집행 현황 대시보드" },
  { category: "명단", work: "교육 수강생 출석부" },
  { category: "업무", work: "부서별 업무 진행 현황 보드" },
  { category: "재미", work: "팀 점심 메뉴 룰렛" },
];
