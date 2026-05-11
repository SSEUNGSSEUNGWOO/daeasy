# dataeasy supabase

Supabase 프로젝트 스키마 / 마이그레이션 / RLS 정책.

## 구조

```
migrations/
  20260509120000_init_schema.sql   # 테이블 + 트리거
  20260509120001_init_rls.sql      # RLS 정책
seed.sql                           # 로컬 개발용 시드
```

## 테이블 한눈에

| 테이블 | 용도 | 쓰는 주체 |
|--------|------|----------|
| `courses` | 교육과정 | 어드민 |
| `cases` | 교육 사례 | 어드민 |
| `guides` | 가이드 | 어드민 + ai-service `/guide-publish` |
| `insights` | 인사이트 (동향 리포트) | ai-service `/insight-publish` |
| `raw_items` | 크롤러 수집 원본 | ai-service insights 파이프라인 |
| `newsletter_subscribers` | 뉴스레터 구독자 | 사이트 구독 폼 (anon insert) |
| `newsletter_issues` | 뉴스레터 발송호 | ai-service / 어드민 |
| `contact_inquiries` | 교육 문의 | 사이트 문의 폼 (anon insert) |

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

- `courses` / `cases` / `guides` — `status = 'published'` 만 anon 읽기
- `insights` — anon 읽기 모두 허용 (자동 발행 시 published만 저장)
- `newsletter_subscribers` — anon insert만 (구독 폼)
- `contact_inquiries` — anon insert만 (문의 폼)
- `raw_items` / `newsletter_issues` — anon 접근 불가 (어드민 / ai-service 전용)

쓰기는 모두 service_role을 통해. backend / ai-service에서만 service_role 키를 사용한다.

## 발행 상태 모델

`courses`, `cases`, `guides` 모두 `public.content_status` enum (`draft` / `published`) 공유. 어드민과 ai-service 모두 같은 컬럼을 본다.
