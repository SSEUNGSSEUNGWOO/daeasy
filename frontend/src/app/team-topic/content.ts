// 팀 프로젝트 공고 — 주제 예시 10선 (참고용). 조 개수·검증·선택 UI 는 TEAM_COUNT 하나를 본다.

export const TEAM_COUNT = 8;

export type Topic = {
  code: string;
  icon: string;
  title: string;
  q: string;
  data: string[];
};

export const TOPICS: Topic[] = [
  {
    code: "A", icon: "🙋", title: "맞춤형 공공서비스 추천",
    q: "나이·소득·지역·상황을 입력하면 받을 수 있는 중앙·지자체 서비스를 한 번에.",
    data: ["정부24", "복지로", "보조금24"],
  },
  {
    code: "B", icon: "📮", title: "민원 트렌드 리포트",
    q: "국민이 어떤 민원을 어디에 제기하나? 지역·시기·주제별 급증 신호 감지.",
    data: ["국민신문고", "안전신문고", "정책소통포털"],
  },
  {
    code: "C", icon: "🗺️", title: "지자체 AI 사업 지도",
    q: "243개 지자체·중앙부처가 어떤 AI 사업을 하나? 중복 사업은 얼마나 되나?",
    data: ["나라장터", "지방재정365", "열린혁신"],
  },
  {
    code: "D", icon: "🧬", title: "정책 계보 추적기",
    q: "중앙정책 → 조례 → 예산 → 집행 → 성과까지 한 줄로. 얼마 쓰였고 뭐가 남았나?",
    data: ["법제처", "e나라지표", "국회예산정책처"],
  },
  {
    code: "E", icon: "⚖️", title: "지자체 정책 비교·벤치마킹",
    q: "같은 주제(예: 저출생)에 지자체별 예산·수혜자·성과가 얼마나 다른가?",
    data: ["지방재정365", "지자체 백서", "통계청 지역통계"],
  },
  {
    code: "F", icon: "🔍", title: "AI 사업 성과 검증기",
    q: "\"민원처리 40% 단축\" 같은 성과 주장을 다른 데이터·언론과 교차 검증해 신뢰도 점수.",
    data: ["보도자료", "감사원", "언론기사"],
  },
  {
    code: "G", icon: "💰", title: "예산 흐름 대시보드",
    q: "디지털·AI·복지 예산이 어느 부처·지자체·사업으로 흘러가나? 집행률·이월·불용은?",
    data: ["열린재정", "지방재정365", "국고보조금"],
  },
  {
    code: "H", icon: "📜", title: "지자체 조례 진화 추적",
    q: "같은 조례를 지자체별로 어떻게 다르게 만들었나? 어떤 조항이 어디서 시작돼 확산됐나?",
    data: ["국가법령정보센터", "자치법규정보시스템", "지방의회 회의록"],
  },
  {
    code: "I", icon: "🏗️", title: "공공사업 낙찰 네트워크",
    q: "어떤 수행기관·컨소시엄이 어떤 사업을 반복 수주하나? 낙찰 편중과 진입장벽 시각화.",
    data: ["나라장터 낙찰", "조달청 통계", "사업자등록 매칭"],
  },
  {
    code: "J", icon: "📣", title: "공약 이행률 트래커",
    q: "단체장·국회의원 공약이 실제 예산·사업·조례로 이어졌나? 발표 → 편성 → 집행 → 완료.",
    data: ["공약 DB", "시정 백서", "열린재정"],
  },
];

export type TeamTopic = {
  team_no: number;
  title: string;
  one_liner: string;
  submitted_by: string;
  updated_at: string;
};

/** 숫자·모노그램용 디스플레이 서체 (root layout 의 Plus Jakarta Sans 변수) */
export const NUM_FONT = { fontFamily: "var(--font-jakarta), var(--font-pretendard), sans-serif" } as const;
