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
| `courses` | 교육과정 | 어드민 |
| `cases` | 교육 사례 | 어드민 |
| `guides` | 가이드 | 어드민 + ai-service `/guide-publish` |
| `insights` | 인사이트 (동향 리포트) | ai-service `/insight-publish` |
| `insight_likes` | 인사이트 좋아요 | 사이트 (anon insert) |
| `raw_items` | 크롤러 수집 원본 | ai-service insights 파이프라인 |
| `newsletter_subscribers` | 뉴스레터 구독자 | 사이트 구독 폼 |
| `newsletter_issues` | 뉴스레터 발송호 | 어드민 (발송 경로 미구현) |
| `contact_inquiries` | 교육 문의 | 사이트 문의 폼 |
| `rental_inquiries` | 장비 대여 문의 | 사이트 대여 폼 |

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

쓰기는 모두 service_role 을 통해. Next.js Route Handler(서버) 와 ai-service 에서만 service_role 키를 사용한다.

## 발행 상태 모델

`courses`, `cases`, `guides`, `insights` 모두 `public.content_status` enum (`draft` / `published`) 공유. 어드민과 ai-service 모두 같은 컬럼을 본다.

`insights` 는 ai-service 가 `status` 를 지정하지 않고 INSERT 하므로 default 인 `published` 로 들어가고,
`ON CONFLICT` 갱신 목록에도 없어 어드민이 draft 로 내린 글은 재발행 시에도 draft 를 유지한다.
