# dataeasy supabase

Supabase 프로젝트 스키마 / 마이그레이션 / RLS 정책.

## 구조

```
migrations/    파일명(YYYYMMDDHHMMSS) 순서대로 적용
seed.sql       로컬 개발용 시드
```

## 테이블 한눈에

| 테이블 | 용도 | 쓰는 주체 |
|--------|------|----------|
| `profiles` | 어드민 사용자 역할 (`admin` / `editor`) | 어드민 `/admin/members` |
| `courses` | 교육과정 | 어드민 |
| `cases` | 교육 사례 | 어드민 |
| `guides` | 가이드 | 어드민 + ai-service `/guide-publish` |
| `insights` | 인사이트 (동향 리포트) | ai-service `/insight-publish` |
| `insight_likes` | 인사이트 좋아요 | 사이트 (anon insert) |
| `raw_items` | 크롤러 수집 원본 | ai-service insights 파이프라인 |
| `newsletter_subscribers` | 뉴스레터 구독자 | 사이트 구독 폼 + 회원가입 선택 동의 |
| `newsletter_issues` | 뉴스레터 발송호 | 어드민 (발송 경로 미구현) |
| `customer_profiles` | 일반 고객 계정 정보 (어드민 `profiles` 와 권한 경계 분리) | 회원가입 트리거 |
| `contact_inquiries` | 교육 문의 | 사이트 문의 폼 |
| `rental_inquiries` | 강의실 대관 문의 | 사이트 대관 폼 |
| `rental_bookings` | 대관 확정 예약 (예약 현황 캘린더) | 어드민 `/admin/rental-schedule` |

**문의-회원 연결** — `contact_inquiries` / `rental_inquiries` 의 `user_id` 는 접수 시점에
로그인 세션이 있을 때만 Route Handler 가 채운다(`on delete set null`). 비회원 문의는 `null` 이며,
`/mypage` 는 이 컬럼으로 본인 문의만 조회한다. 클라이언트가 보낸 `user_id` 는 받지 않는다.

**광고성 정보 수신 동의** — `customer_profiles.marketing_agreed_at`. 개인정보 수집·이용 동의와
별개(정보통신망법)라 가입 폼의 선택 체크박스로 받고, 동의한 경우에만
`newsletter_subscribers` 에 `source = 'signup'` 으로 등록한다.

Storage 버킷 `content-images` — 어드민 이미지 업로드 (`/api/admin/upload`), public read.

## 적용 방법

**옵션 1: Supabase Studio에서 직접 실행**
- 대시보드 → SQL Editor에 마이그레이션 파일 내용 붙여넣고 순서대로 실행
- 시드: 같은 방식으로 `seed.sql` 실행

**옵션 2: Supabase CLI (권장, 추후)**
```bash
supabase login
supabase link --project-ref <ref>
supabase db push
```

## RLS 정책 요약

- `courses` / `cases` / `guides` / `insights` — `status = 'published'` 만 anon 읽기
- `insight_likes` — anon 읽기 + insert
- `newsletter_subscribers` / `contact_inquiries` / `rental_inquiries` — anon insert만 (폼 제출)
- `raw_items` / `newsletter_issues` — anon 접근 불가 (어드민 / ai-service 전용)
- `profiles` — RLS 는 켜되 **정책이 하나도 없다** = anon / authenticated 전부 차단, service_role 전용.
  역할 정보가 브라우저로 새어나가면 안 되기 때문
- `rental_bookings` — `profiles` 와 같은 패턴 (정책 0개, service_role 전용). 공개 캘린더는 서버가 날짜·슬롯만 내려준다

쓰기는 모두 service_role 을 통해. Next.js Route Handler(서버) 와 ai-service 에서만 service_role 키를 사용한다.

## 발행 상태 모델

`courses`, `cases`, `guides`, `insights` 모두 `public.content_status` enum (`draft` / `published`) 공유. 어드민과 ai-service 모두 같은 컬럼을 본다.

`insights` 는 ai-service 가 `status` 를 지정하지 않고 INSERT 하므로 default 인 `published` 로 들어가고,
`ON CONFLICT` 갱신 목록에도 없어 어드민이 draft 로 내린 글은 재발행 시에도 draft 를 유지한다.
