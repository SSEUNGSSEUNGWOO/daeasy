// 팀 프로젝트 공고 — 주제 예시 10선. 공고 HTML(team-project-notice-v2) 의 카드 내용을 그대로 옮김.
// 조 개수·검증·드롭다운은 TEAM_COUNT 하나를 본다.

export const TEAM_COUNT = 8;
export const NEW_TOPIC_CODE = "NEW";

export type Topic = {
  code: string;
  icon: string;
  title: string;
  tag: string;
  q: React.ReactNode;
  data: string[];
  hi?: boolean;
};

export const TOPICS: Topic[] = [
  {
    code: "A", icon: "🙋", title: "맞춤형 공공서비스 추천", tag: "FOR CITIZENS", hi: true,
    q: <>나이·소득·지역·상황을 입력하면 받을 수 있는 <b>중앙·지자체 서비스</b>를 한 번에. 흩어진 신청 조건을 <b>외부 데이터로 통합</b>해 국민에게 답한다.</>,
    data: ["정부24 API", "복지로 API", "지자체 복지사업 크롤링", "보조금24"],
  },
  {
    code: "B", icon: "📮", title: "민원 트렌드 리포트", tag: "VOICE OF CITIZEN", hi: true,
    q: <>국민이 <b>어떤 민원을 어디에</b> 제기하고 있나? 지역·시기·주제별 <b>민원 급증 신호</b>를 감지하고, 담당 부처·지자체 대응까지 연결.</>,
    data: ["국민신문고 공개민원", "지자체 시민제안", "안전신문고", "정책소통포털"],
  },
  {
    code: "C", icon: "🗺️", title: "지자체 AI 사업 지도", tag: "WHO'S DOING WHAT", hi: true,
    q: <>전국 243개 지자체·중앙부처가 <b>어떤 AI 사업</b>을 하나? 우리 시가 옆 시보다 뒤처졌나? <b>중복 사업</b>은 얼마나 되나?</>,
    data: ["나라장터·조달청 공고", "지방재정365", "열린혁신 플랫폼", "지자체 공고 크롤링"],
  },
  {
    code: "D", icon: "🧬", title: "정책 계보 추적기", tag: "POLICY LINEAGE",
    q: <>청년·저출생·기후 이슈에서 <b>중앙정책 → 조례 → 예산 → 집행 → 성과</b>까지 한 줄로. 이 정책은 얼마 쓰였고 뭐가 남았나?</>,
    data: ["법제처·자치법규", "e나라지표", "국회예산정책처", "부처 백서·평가보고서"],
  },
  {
    code: "E", icon: "⚖️", title: "지자체 정책 비교·벤치마킹", tag: "BENCHMARK",
    q: <>같은 주제(예: 저출생)에 지자체별로 <b>예산·수혜자·성과</b>가 얼마나 다른가? &quot;우리도 뭐 해야 하지?&quot; 담당자용 참고 서비스.</>,
    data: ["지방재정365", "지자체 백서·보도자료", "지방자치인재개발원", "통계청 지역통계"],
  },
  {
    code: "F", icon: "🔍", title: "AI 사업 성과 검증기", tag: "FACT-CHECK",
    q: <>정부·지자체가 발표한 성과 주장(예: <b>&quot;민원처리 40% 단축&quot;</b>)을 다른 데이터·언론과 교차 검증해 <b>신뢰도 점수</b>를 매긴다.</>,
    data: ["보도자료·정책 브리핑", "감사원 감사결과", "e나라지표", "언론기사 크롤링"],
  },
  {
    code: "G", icon: "💰", title: "예산 흐름 대시보드", tag: "MONEY FLOW",
    q: <>특정 분야(디지털·AI·복지) 예산이 <b>어느 부처·지자체·사업</b>으로 흘러가나? 편성 대비 <b>집행률·이월·불용액</b>은?</>,
    data: ["열린재정", "지방재정365", "국고보조금통합관리시스템"],
  },
  {
    code: "H", icon: "📜", title: "지자체 조례 진화 추적", tag: "ORDINANCE DIFF",
    q: <>같은 조례를 <b>지자체별로 어떻게 다르게</b> 만들었나? 어떤 조항이 <b>확산</b>되고, 어디서 시작됐나? 조례 유전자 지도.</>,
    data: ["국가법령정보센터", "자치법규정보시스템", "지방의회 회의록"],
  },
  {
    code: "I", icon: "🏗️", title: "공공사업 낙찰 네트워크", tag: "PROCUREMENT NET",
    q: <>어떤 <b>수행기관·컨소시엄</b>이 어떤 사업을 반복 수주하는가? 지역·분야별 <b>낙찰 편중</b>과 신규 진입장벽 시각화.</>,
    data: ["나라장터 공고·낙찰", "조달청 통계", "기업 사업자등록 매칭"],
  },
  {
    code: "J", icon: "📣", title: "공약 이행률 트래커", tag: "PROMISE TRACKER",
    q: <>단체장·국회의원의 <b>공약</b>이 실제 <b>예산·사업·조례</b>로 이어졌나? 발표 → 편성 → 집행 → 완료를 한 줄로.</>,
    data: ["공약 데이터베이스", "지자체 시정 백서", "열린재정·지방재정365"],
  },
];


export type TeamTopic = {
  team_no: number;
  topic_code: string;
  title: string;
  one_liner: string;
  submitted_by: string;
  updated_at: string;
};
