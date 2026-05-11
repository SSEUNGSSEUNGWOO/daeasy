# daeasy · Petal-Dots logo

6개 데이지 꽃잎 외곽선이 6개 데이터 포인트를 1:1로 감싸고, 중앙 액센트 점이 인사이트의 중심을 표현. 워드마크는 회사명 'daeasy'.

## 사용 파일

- `daeasy-symbol-yellow-classic.svg` — 메인 심볼 (중앙 액센트 #FFD43B)
- `daeasy-wordmark-yellow-classic.svg` — 메인 워드마크 (라이트 모드)
- `daeasy-symbol-mono.svg` — 단색 차콜 fallback (인쇄·favicon)
- `daeasy-wordmark-mono.svg` — 단색 차콜 워드마크
- `daeasy-symbol-onDark.svg` — 다크 배경용 심볼
- `daeasy-wordmark-onDark.svg` — 다크 배경용 워드마크 (라이트/다크 자동 전환에 사용)
- `daeasy-symbol-mustard.svg` / `daeasy-wordmark-mustard.svg` — 머스타드 #F5B83C 변형 (옵션)

## 디자인 스펙

- viewBox: 100×100 (symbol) / **420×120 (wordmark)**
- Stroke: 1.8 (≈ 1pt feel at 100unit canvas)
- Petal: orbit 18, rx 8.5, ry 13
- Petal-center dot r: 2.5
- Center accent dot r: 4
- Wordmark: Plus Jakarta Sans, weight 700, size 56, **uppercase 'DAEASY'**, letter-spacing 2

## 브랜드 컬러

| 토큰 | 코드 | 쓰임 |
|------|------|------|
| `daisy` | `#FFD43B` | 액센트 (중앙점, CTA 강조) — 메인 |
| `mustard` | `#F5B83C` | 액센트 옵션 (더 어두운 톤) |
| `ink` | `#17150F` | 외곽선·텍스트 메인 |
| `paper` | `#F5F1E8` | 따뜻한 배경 (옵션) |

Tailwind 클래스: `bg-daisy`, `text-ink`, `bg-paper` 등 (`frontend/src/app/globals.css` `@theme inline`에 등록).

## 회사 이름 / 사이트 도메인

- 회사·브랜드 워드마크: **daeasy**
- 사이트 도메인: **dataeasy.kr**

워드마크에는 회사명(daeasy)을 노출하지만, 사이트 도메인·메타데이터에는 dataeasy.kr 사용. 두 표기를 의도적으로 구분한다.
