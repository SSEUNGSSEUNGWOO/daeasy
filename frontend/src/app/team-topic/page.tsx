import type { Metadata } from "next";

import "./team-topic.css";
import { TeamTopicBoard } from "./board";

// 교육생 배포용 임시 페이지 — 검색엔진 색인 제외
export const metadata: Metadata = {
  title: "팀 프로젝트 주제 방향성 — 조별 제출",
  robots: { index: false, follow: false },
};

const METHOD = [
  ["주제·범위 선정", "한 팀 = 한 주제. 대상 부처·지자체·이슈를 명확히 좁힌다."],
  ["외부 데이터 확보", "공공데이터 API · 크롤링 · PDF 파싱 · 필요시 직접 수집·라벨링."],
  ["AI 에이전트 분석", "MCP로 도구 호출, 에이전트가 비교·요약·이상탐지·교차검증."],
  ["시각화·인사이트", "지도·타임라인·네트워크·대시보드로 “한 화면에서 이해되게”."],
  ["시연·문서화", "웹 프로토타입 + 데이터 소스 문서 + 팀별 시연 5분."],
] as const;

export default function TeamTopicPage() {
  return (
    <div className="tp">
      <div className="page">
        <section className="hero">
          <div className="hero-top">
            <div>TEAM PROJECT · PUBLIC POLICY × DATA × AI AGENT</div>
            <div className="r">243 지자체 · 중앙부처 · 데이터로 꿰다</div>
          </div>
          <h1>
            <span className="accent">범정부 AI 서비스</span>
            <br />
            팀 프로젝트 주제 방향성
          </h1>
          <p className="lead">
            외부 데이터를 활용한 다양한 범정부·지자체 AI 서비스 사례 — 아래에서 하나 골라, 팀만의
            서비스로 만들어 오세요
          </p>
          <div className="hero-badge">
            <div className="hb-ic">📊</div>
            <div>
              <div className="hb-t1">PUBLIC × DATA × AI</div>
              <div className="hb-t2">외부 데이터 기반 팀 프로젝트</div>
            </div>
          </div>
          <div className="mp-row">
            <div className="mp mission">
              <div className="tag">
                <div className="ico">🎯</div>미션
              </div>
              <div className="body">
                외부 데이터를 <b>수집·정제·분석</b>해 국민·공무원·연구자에게 도움이 되는{" "}
                <b>범정부 AI 서비스</b>를 팀 단위로 기획·구현·시연한다.
              </div>
            </div>
            <div className="mp problem">
              <div className="tag">
                <div className="ico">💡</div>선택의 폭
              </div>
              <div className="body">
                국민 맞춤 서비스부터 정책·예산 분석, 사업 검증, 조례 비교까지 — <b>10가지 방향</b>을
                예시로 제시합니다. 이 중 하나를 고르거나, 이 프레임으로 새 주제를 제안하세요.
              </div>
            </div>
          </div>
        </section>

        <TeamTopicBoard />

        <section className="method">
          <div className="sec-head">
            <h2>
              공통 방법론 — <em>어떤 주제든 이 5단계</em>
            </h2>
            <div className="sub">데이터 확보가 프로젝트의 절반</div>
          </div>
          <div className="method-flow">
            {METHOD.map(([t, d], i) => (
              <div className="m-step" key={t}>
                <span className="n">{i + 1}</span>
                <span className="t">{t}</span>
                <div className="d">{d}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="band">
          <div className="l">
            <div className="kicker">TEAM · MISSION</div>
            <h3>
              공통
              <br />
              미션
            </h3>
            <p>
              공공은 이미
              <br />
              데이터를 쏟아내고 있다.
              <br />
              우리는 그걸 <b>서비스로 만든다.</b>
            </p>
          </div>
          <div className="m">
            <table>
              <tbody>
                <tr><td className="icn">🎯</td><td className="k">목표</td><td className="v">외부 데이터를 활용한 <b>범정부 AI 서비스</b> 하나를 완성한다</td></tr>
                <tr><td className="icn">🧭</td><td className="k">방향</td><td className="v">10가지 예시 중 <b>1개 선택</b> · 또는 같은 프레임의 새 주제 제안 가능</td></tr>
                <tr><td className="icn">👥</td><td className="k">이용자</td><td className="v">국민 · 공무원 · 연구자 · 언론 — 팀이 <b>누구를 위한 서비스인지</b> 명확히</td></tr>
                <tr><td className="icn">🗂️</td><td className="k">데이터</td><td className="v">공공데이터 API · 크롤링 · PDF 파싱 · 직접 수집·정제 <b>(외부 데이터 중심)</b></td></tr>
                <tr><td className="icn">⚙️</td><td className="k">구현</td><td className="v"><b>바이브코딩 · 에이전트 · MCP · 컨텍스트</b> 활용</td></tr>
                <tr><td className="icn">💡</td><td className="k">핵심 질문</td><td className="v">“이 서비스는 <b>누구의 어떤 문제</b>를 푸는가?” — 한 문장으로 답할 수 있어야 함</td></tr>
                <tr><td className="icn">👥</td><td className="k">팀 구성</td><td className="v">4명 1팀 · 역할 분담(기획·데이터·개발·시연) 자율</td></tr>
                <tr><td className="icn">📊</td><td className="k">산출물</td><td className="v">웹 프로토타입 + 데이터 소스 문서 + 팀별 시연 (5분)</td></tr>
              </tbody>
            </table>
          </div>
          <div className="r">
            <div className="sc">
              <div className="sc-ic">✨</div>
              <div className="sc-t1">데이터로 만드는</div>
              <div className="sc-t2">
                더 나은 <em>공공서비스</em>
              </div>
            </div>
            <div className="foot">
              PUBLIC × DATA × AI
              <br />
              TEAM PROJECT · 2026
            </div>
          </div>
        </section>

        <section className="meta">
          <div className="who">
            CDSA · 바이브코딩 프로젝트 팀<span>Agent · MCP · Context 실전 프로젝트</span>
          </div>
          <div>한 팀 · 한 주제 · 하나의 외부 데이터 · 하나의 의사결정 변화</div>
        </section>
      </div>
    </div>
  );
}
