# 아키텍처 메모

1단계 스캐폴딩 시점 기준. 변경 시 같이 업데이트.

## 데이터 흐름

```
브라우저
  ├── 공개 페이지 (Next.js SSR/SSG)
  │     └─→ Supabase JS (anon key)  : 공개 콘텐츠 읽기 (RLS)
  │     └─→ FastAPI                  : 뉴스레터 구독 / 문의 등 검증 필요한 쓰기
  └── 어드민 페이지 (Next.js)
        └─→ FastAPI (service role)   : 콘텐츠 CRUD / 뉴스레터 발송
```

## 책임 분리

- **Next.js (frontend)**: UI, 라우팅, SEO, 정적 콘텐츠 캐싱, anon 키로 직접 읽기 가능한 데이터
- **FastAPI (backend)**: 검증 필요한 쓰기, 뉴스레터 발송 작업 큐, 어드민 권한이 필요한 mutation
- **Supabase**: PostgreSQL + Auth + Storage. RLS로 데이터 접근 제어

## 보안 원칙

- `service_role` 키는 backend에만 둔다. frontend 코드/번들에 절대 노출 금지
- frontend는 `anon` 키만 사용. RLS가 1차 방어선
- 어드민 mutation은 backend를 통해서만 (frontend → backend → Supabase)

## 미정사항 (다음 단계에서 결정)

- 인증 방식: Supabase Auth(이메일/패스워드) vs OAuth
- 어드민 role 모델: profiles 테이블 + role 컬럼 vs Supabase 별도 schema
- 메일 발송 서비스: Resend / AWS SES / NHN Cloud
- 배포 환경: Vercel + Railway 조합 검토 중
