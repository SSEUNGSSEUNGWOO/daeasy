import json
import re
import subprocess
import time
from datetime import date
from pathlib import Path

import requests
import yt_dlp
from bs4 import BeautifulSoup

GUIDES_PATH = Path(__file__).resolve().parents[2] / "frontend" / "content" / "guides.json"
CACHE_DIR = Path(__file__).parent / "data"
MAX_ARTICLE_CHARS = 5000
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
}


def _cache_path(topic: str) -> Path:
    safe = re.sub(r"[^\w가-힣]", "_", topic.lower().strip())
    return CACHE_DIR / f"{safe}.json"


def load_cache(topic: str) -> dict | None:
    path = _cache_path(topic)
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return None


def save_cache(topic: str, articles: list[dict], texts: list[str], youtube: list[dict]) -> None:
    CACHE_DIR.mkdir(exist_ok=True)
    data = {"topic": topic, "articles": articles, "texts": texts, "youtube": youtube}
    _cache_path(topic).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  → 캐시 저장: {_cache_path(topic).name}")


def search_articles(topic: str, n: int = 6) -> list[dict]:
    """DuckDuckGo 검색으로 관련 아티클 URL 수집."""
    from ddgs import DDGS
    query = f"{topic} explained guide tutorial site:medium.com OR site:towardsdatascience.com OR site:ibm.com OR site:aws.amazon.com OR site:datacamp.com"
    try:
        results = []
        EXCLUDE_DOMAINS = ["youtube.com", "youtu.be", "reddit.com", "zhihu.com", "csdn.net", "baidu.com", "weibo.com", "naver.com"]
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=n * 3):
                url = r.get("href", "")
                if not url.startswith("http"):
                    continue
                if any(x in url for x in EXCLUDE_DOMAINS):
                    continue
                results.append({"title": r.get("title", ""), "url": url})
                if len(results) >= n:
                    break
        return results
    except Exception as e:
        print(f"  [검색 오류] {e}")
        return []


def fetch_article(url: str) -> str | None:
    """URL에서 본문 텍스트 추출."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # 불필요한 태그 제거
        for tag in soup(["script", "style", "nav", "header", "footer", "aside", "form"]):
            tag.decompose()

        # 본문 우선순위: article > main > body
        content = soup.find("article") or soup.find("main") or soup.find("body")
        if not content:
            return None

        text = content.get_text(separator="\n", strip=True)
        # 연속 빈줄 정리
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text[:MAX_ARTICLE_CHARS] if text.strip() else None
    except Exception:
        return None


def search_youtube(topic: str, n: int = 3) -> list[dict]:
    """YouTube 영상 검색 - 한국어 우선, 부족하면 영어로 보충."""
    opts = {"quiet": True, "no_warnings": True, "extract_flat": True}
    seen = set()
    videos = []

    def fetch(query: str, count: int) -> list[dict]:
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                results = ydl.extract_info(f"ytsearch{count}:{query}", download=False)
            out = []
            for entry in (results.get("entries") or []):
                vid_id = entry.get("id") or ""
                if not vid_id or vid_id in seen:
                    continue
                seen.add(vid_id)
                out.append({
                    "id": vid_id,
                    "title": entry.get("title", ""),
                    "url": f"https://www.youtube.com/watch?v={vid_id}",
                    "channel": entry.get("uploader") or entry.get("channel") or "",
                })
            return out
        except Exception:
            return []

    # 한국어 먼저
    videos += fetch(f"{topic} 설명 강의", n)
    # 부족하면 영어로 보충
    if len(videos) < n:
        videos += fetch(f"{topic} tutorial", n - len(videos))

    return videos[:n]


def write(topic: str, articles: list[dict], texts: list[str], youtube: list[dict], feedback: str = "") -> dict:
    article_block = ""
    for i, (a, t) in enumerate(zip(articles, texts), 1):
        article_block += f"\n\n[아티클 {i}: {a['title']}]\n출처: {a['url']}\n\n{t}"

    youtube_block = "\n".join(
        f"- {v['title']} ({v['channel']}) — {v['url']}" for v in youtube
    )

    feedback_block = f"\n\n## 이전 평가 피드백 (반드시 반영)\n{feedback}" if feedback else ""

    prompt = f"""다음은 "{topic}"에 관한 웹 아티클 {len(articles)}개입니다.
이 내용을 바탕으로 AI·데이터를 업무에 도입·활용하려는 비전공자·실무자를 위한 한국어 가이드 초안을 작성하세요.
(독자는 일반 기업·공공기관·AI 전환을 추진하는 조직 모두 포함)
{feedback_block}

{article_block}

---

참고 YouTube 영상 (본문에 추천 링크로 포함 가능):
{youtube_block}

---

아래 JSON 형식으로만 응답하세요.

{{
  "slug": "영문 소문자와 하이픈 (예: what-is-rag)",
  "title": "한국어 제목",
  "summary": "한 문장 요약 (50자 이내)",
  "category": "AI 기초 | 실무 활용 | 기술 심화 중 하나",
  "difficulty": "입문 | 기초 | 심화 중 하나",
  "tags": ["태그1", "태그2", "태그3"],
  "tldr": ["핵심 요약 1", "핵심 요약 2", "핵심 요약 3"],
  "images": [
    {{
      "id": "영문-소문자-하이픈 식별자 (예: rag-flow-diagram)",
      "type": "cover | diagram | example | infographic",
      "description": "ChatGPT 이미지 생성용 영어 프롬프트. wide 16:9 landscape orientation. 텍스트/라벨/글자 절대 금지. 주제에 어울리는 색상 자유롭게 선택 (dark navy 고정 금지). 아이콘·도형·색상·구도로만 표현."
    }}
  ],
  "body": "마크다운 본문. ## 섹션 구분. 이미지가 필요한 위치에 {{{{image:id}}}} 플레이스홀더 삽입 (cover 제외). 2000자 이상."
}}

이미지 작성 원칙:
- type=cover: 반드시 1개 포함. 가이드 상단에 표시될 커버 이미지.
- type=diagram/example/infographic: 실제로 시각화가 독자 이해에 도움이 될 때만 포함 (0~2개)
- 이미지가 없어도 이해되는 내용이면 images 배열에 cover만 포함
- {{{{image:id}}}} 플레이스홀더는 해당 섹션 내용 바로 뒤에 삽입
- cover 이미지는 body에 플레이스홀더 삽입 금지

제목 원칙:
- 주제 키워드를 앞에 먼저. "{{주제}}: 부제" 또는 "{{주제}}란? 설명" 형식 권장
- 누구나 클릭하고 싶은 제목. "실무자를 위한 ~" 같은 타겟 명시 금지
- 궁금증·놀라움·실용성을 자극하는 부제 사용
- 예시: "바이브코딩: 코딩 몰라도 앱을 만드는 법", "RAG란? AI가 틀린 말을 하지 않게 만드는 방법"
- 실무·업무 맥락은 제목이 아닌 본문에서 자연스럽게 녹임

작성 원칙:
- 기술 용어는 처음 등장 시 한국어로 풀어 설명
- 비즈니스/실무 활용 예시 최소 2개 (본문 내 자연스럽게, 일반 기업·공공·AI 전환 조직 중 어떤 곳이든 OK)
- 아티클 내용 재구성 (원문 번역 금지)
- YouTube 영상은 본문 내 관련 섹션에 자연스럽게 추천
- AI 상투어 금지: '살펴보겠습니다', '알아보겠습니다', '중요한 시사점' 등"""

    import os
    env = {k: v for k, v in os.environ.items() if k != "ANTHROPIC_API_KEY"}
    result = subprocess.run(
        ["claude", "-p", "-"],
        input=prompt,
        capture_output=True,
        text=True,
        timeout=180,
        env=env,
        encoding="utf-8",
    )
    if result.returncode != 0:
        raise RuntimeError(f"claude CLI 실패 (code={result.returncode}): {result.stderr or result.stdout[:200]}")
    raw = result.stdout

    # ```json ... ``` 블록 우선 추출
    code_match = re.search(r"```(?:json)?\s*(\{[\s\S]+?\})\s*```", raw)
    json_str = code_match.group(1) if code_match else None

    if not json_str:
        match = re.search(r"\{[\s\S]+\}", raw)
        if not match:
            raise ValueError(f"JSON 파싱 실패:\n{raw}")
        json_str = match.group()

    try:
        guide = json.loads(json_str)
    except json.JSONDecodeError:
        # body 필드만 추출해서 별도 처리
        body_match = re.search(r'"body"\s*:\s*"([\s\S]*?)"\s*[,}]', json_str)
        if body_match:
            body_raw = body_match.group(1)
            json_str = json_str[:body_match.start()] + f'"body": {json.dumps(body_raw)}' + json_str[body_match.end()-1:]
        try:
            guide = json.loads(json_str)
        except json.JSONDecodeError:
            json_str = re.sub(r'(?<!\\)\n', '\\n', json_str)
            guide = json.loads(json_str)
    guide["published_at"] = date.today().isoformat()
    guide["status"] = "draft"
    guide["videos"] = [
        {"title": v["title"], "url": v["url"], "channel": v["channel"]}
        for v in youtube
    ]
    return guide


def save(guide: dict) -> None:
    guides = []
    if GUIDES_PATH.exists():
        guides = json.loads(GUIDES_PATH.read_text(encoding="utf-8"))

    guides = [g for g in guides if g.get("slug") != guide["slug"]]
    guides.insert(0, guide)
    GUIDES_PATH.write_text(json.dumps(guides, ensure_ascii=False, indent=2), encoding="utf-8")
