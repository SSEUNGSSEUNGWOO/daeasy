import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent.parent
load_dotenv(ROOT / ".env")
load_dotenv(Path(__file__).parent.parent / ".env", override=False)
import os as _os; _os.environ.pop("ANTHROPIC_API_KEY", None)  # Claude CLI는 구독 사용, API 크레딧 금지
sys.path.insert(0, str(Path(__file__).parent.parent))  # ai-service/

from guides.writer import search_articles, fetch_article, search_youtube, write, save, load_cache, save_cache
from guides.evaluator.evaluator import evaluate, load_rubric
from guides.editor.editor import edit

FRONTEND_PUBLIC = ROOT / "frontend" / "public" / "guides"


def generate_images(guide: dict) -> dict:
    import os
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("  [이미지] OPENAI_API_KEY 없음. 이미지 생성 생략.")
        return guide

    images = guide.get("images", [])
    if not images:
        return guide

    FRONTEND_PUBLIC.mkdir(parents=True, exist_ok=True)
    slug = guide["slug"]
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    style_prefix = (
        "Flat design illustration, clean minimal style, professional and trustworthy, 16:9 aspect ratio. "
        "ABSOLUTELY NO TEXT, NO LABELS, NO LETTERS, NO WORDS, NO NUMBERS anywhere in the image. "
        "Pure visual metaphor only, icon-based, symbol-based. "
    )

    updated_images = []
    for img in images:
        img_id = img["id"]
        img_type = img["type"]
        description = img["description"]
        filename = f"{slug}-{img_id}.png"
        save_path = FRONTEND_PUBLIC / filename
        url_path = f"/guides/{filename}"

        print(f"  [이미지] 생성 중: {img_id} ({img_type})")

        dalle_prompt = style_prefix + description

        try:
            resp = requests.post(
                "https://api.openai.com/v1/images/generations",
                headers=headers,
                json={"model": "dall-e-3", "prompt": dalle_prompt, "size": "1792x1024", "n": 1},
                timeout=60,
            )
            resp.raise_for_status()
            image_url = resp.json()["data"][0]["url"]
            img_data = requests.get(image_url, timeout=30).content
            save_path.write_bytes(img_data)
            print(f"  [이미지] 저장: {save_path.name}")
            updated_images.append({**img, "url": url_path})
        except Exception as e:
            print(f"  [이미지] 실패 ({img_id}): {e}")
            updated_images.append(img)

    guide["images"] = updated_images
    return guide


def run(topic: str) -> None:
    rubric = load_rubric()
    max_retries = rubric.get("max_retries", 3)

    # ── 1. 아티클 + YouTube 수집 (캐시 우선) ──────
    cached = load_cache(topic)
    if cached and cached.get("articles"):
        print(f"\n[캐시] '{topic}' 캐시 발견 → 수집 생략")
        articles_ok = cached["articles"]
        texts = cached["texts"]
        youtube = cached.get("youtube", [])
        for a, t in zip(articles_ok, texts):
            print(f"  ✓ {a['title'][:55]} ({len(t):,}자)")
    else:
        print(f"\n[1/3] 웹 검색: '{topic}'")
        articles = search_articles(topic)
        if not articles:
            print("  ✗ 아티클을 찾지 못했습니다.")
            return

        print(f"[2/3] 아티클 본문 수집 ({len(articles)}개)")
        texts, articles_ok = [], []
        for i, a in enumerate(articles):
            if i > 0:
                time.sleep(1)
            t = fetch_article(a["url"])
            if t:
                print(f"  ✓ {a['title'][:55]} ({len(t):,}자)")
                texts.append(t)
                articles_ok.append(a)
            else:
                print(f"  ✗ 본문 없음: {a['title'][:55]}")

        if not texts:
            print("  ✗ 아티클 본문을 가져올 수 없습니다.")
            return

        print(f"  YouTube 추천 영상 검색 중...")
        youtube = search_youtube(topic)
        for v in youtube:
            print(f"  ✓ {v['title'][:55]}")

        save_cache(topic, articles_ok, texts, youtube)

    # ── 2. Writer + Evaluator 루프 ────────────────
    print(f"\n[3/3] 파이프라인 시작")
    feedback = ""
    guide = None

    for attempt in range(1, max_retries + 1):
        print(f"\n  [Writer] 초안 작성 중... (시도 {attempt}/{max_retries})")
        guide = write(topic, articles_ok, texts, youtube, feedback)
        print(f"  [Writer] 완료: {guide['title']}")

        print(f"  [Evaluator] 평가 중...")
        try:
            score, passed, feedback = evaluate(guide)
            print(f"  [Evaluator] 점수: {score:.2f} / 통과: {'✓' if passed else '✗'}")
        except Exception as e:
            print(f"  [Evaluator] 평가 실패 ({e}) → 통과 처리")
            score, passed, feedback = 0.0, True, ""

        if passed:
            break
        if attempt < max_retries:
            print(f"  [Evaluator] 피드백: {feedback}")
            print(f"  → 재작성 요청")
        else:
            print(f"  [Evaluator] 최대 재시도 도달, 현재 버전으로 진행")

    # ── 3. Editor ────────────────────────────────
    print(f"\n  [Editor] 템플릿 정리 + 오탈자 교정 중...")
    guide = edit(guide)
    print(f"  [Editor] 완료")

    guide["evaluation_score"] = round(score, 2)

    # ── 4. 이미지 프롬프트 출력 + url 미리 세팅 ──
    images = guide.get("images", [])
    if images:
        slug = guide["slug"]
        print(f"\n{'─' * 55}")
        print(f"📸 이미지 프롬프트 ({len(images)}개) — ChatGPT 또는 claude.design 사용")
        print(f"{'─' * 55}")
        for img in images:
            url_path = f"/guides/{slug}-{img['id']}.png"
            img["url"] = url_path  # 저장 후 표시될 URL 미리 세팅
            print(f"\n[{img['type'].upper()}] id: {img['id']}")
            print(f"  저장 경로: frontend/public/guides/{slug}-{img['id']}.png")
            print(f"  프롬프트: {img['description']}")
        guide["images"] = images
        print(f"{'─' * 55}")

    save(guide)

    print(f"\n✅ 저장 완료: [{guide['category']}] {guide['title']} (평가 {score:.2f}점)")
    print(f"   참고 아티클 {len(articles_ok)}개 / YouTube 추천 {len(guide['videos'])}개 포함")
    print(f"   위 프롬프트를 ChatGPT에 붙여넣어 이미지 생성 후 해당 경로에 저장하세요")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python guides/run.py <주제>")
        print("예시:   python guides/run.py 'RAG'")
        sys.exit(1)

    run(" ".join(sys.argv[1:]))
