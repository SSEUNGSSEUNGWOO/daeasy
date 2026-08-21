import { CONTACT_EMAIL } from "@/lib/site";

export const metadata = { title: "개인정보 처리방침" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-accent">Privacy</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">개인정보 처리방침</h1>
      <p className="mt-4 text-sm text-zinc-500">시행일: 2026년 8월 6일</p>

      <div className="prose prose-zinc mt-10 max-w-none text-sm leading-7">
        <p>주식회사 케이브레인컴퍼니(브랜드: DAEASY, 이하 “회사”)는 회원 서비스 제공을 위해 필요한 범위에서 개인정보를 처리합니다.</p>

        <h2>1. 수집하는 개인정보와 목적</h2>
        <ul>
          <li>필수 항목: 이름, 이메일, 연락처, 소속</li>
          <li>선택 항목: 광고성 정보 수신 동의(뉴스레터·교육 개설 안내) 및 동의 시점</li>
          <li>수집 목적: 회원 식별과 계정 관리, 교육 및 문의 서비스 제공, 고객 응대</li>
          <li>광고성 정보 수신은 선택이며 동의하지 않아도 회원 가입과 서비스 이용에 제한이 없습니다. 동의 철회는 아래 문의 이메일로 요청할 수 있습니다.</li>
          <li>비밀번호는 Supabase Auth가 암호화된 인증 정보로 관리하며 회사 데이터베이스에 평문으로 저장하지 않습니다.</li>
        </ul>

        <h2>2. 보유 및 이용 기간</h2>
        <p>회원 탈퇴 시 지체 없이 파기합니다. 다만 관계 법령에 따라 보존할 의무가 있거나 분쟁 처리를 위해 필요한 경우에는 해당 기간 동안 분리하여 보관할 수 있습니다.</p>

        <h2>3. 처리 위탁</h2>
        <p>회사는 인증과 데이터 보관을 위해 Supabase, 서비스 운영과 배포를 위해 Vercel을 이용합니다. 각 수탁자는 서비스 제공에 필요한 범위에서만 정보를 처리합니다.</p>

        <h2>4. 이용자의 권리</h2>
        <p>이용자는 자신의 개인정보 열람·정정·삭제 및 처리 정지를 요청할 수 있습니다. 요청은 아래 연락처로 접수할 수 있습니다.</p>

        <h2>5. 안전성 확보 조치</h2>
        <p>회사는 접근 권한 분리, 암호화된 통신, 인증 세션 검증, 데이터베이스 접근 통제와 요청 횟수 제한을 적용합니다.</p>

        <h2>6. 개인정보 보호 문의</h2>
        <ul>
          <li>회사: 주식회사 케이브레인컴퍼니</li>
          <li>주소: 서울특별시 동작구 보라매로5길 51 롯데타워 301~309호</li>
          <li>이메일: {CONTACT_EMAIL}</li>
        </ul>
      </div>
    </article>
  );
}
