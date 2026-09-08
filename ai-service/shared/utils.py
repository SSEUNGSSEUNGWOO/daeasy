import hashlib
import os
import re
import time
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone

# 외부 이미지 복사본 저장 버킷 (public read)
STORAGE_BUCKET = "insight-images"
_MIRROR_EXTS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
}


def mirror_image_to_storage(img_url: str, timeout: int = 15) -> str | None:
    """외부 이미지를 Supabase Storage 에 복사하고 공개 URL 반환.
    원본 사이트가 이미지를 내리거나 핫링크를 막아도 본문이 깨지지 않게 발행 시점에 복사한다.
    실패 시 None — 호출부는 원본 URL 로 폴백 (이미지는 부가 요소라 fail-open)."""
    base = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not base or not key:
        return None
    try:
        resp = requests.get(img_url, timeout=timeout, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
    except Exception:
        return None
    ctype = resp.headers.get("Content-Type", "").split(";")[0].strip().lower()
    ext = _MIRROR_EXTS.get(ctype)
    if not ext:
        return None

    name = compute_hash(img_url) + ext  # URL 기준 결정적 이름 → 재실행 시 같은 파일에 upsert
    try:
        up = requests.post(
            f"{base}/storage/v1/object/{STORAGE_BUCKET}/{name}",
            data=resp.content,
            headers={"Authorization": f"Bearer {key}", "Content-Type": ctype, "x-upsert": "true"},
            timeout=timeout,
        )
        up.raise_for_status()
    except Exception as e:
        print(f"[mirror] 업로드 실패 ({img_url[:60]}): {e}")
        return None
    return f"{base}/storage/v1/object/public/{STORAGE_BUCKET}/{name}"


def compute_hash(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:16]


_IMG_SKIP_KEYWORDS = ("icon", "logo", "avatar", "favicon", "sprite", "placeholder", "1x1", "pixel")


def fetch_og_image(url: str, timeout: int = 5) -> str | None:
    """페이지에서 대표 이미지 추출.
    우선순위: og:image → twitter:image → body 첫 의미있는 <img>."""
    try:
        resp = requests.get(url, timeout=timeout, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        text = resp.text
    except Exception:
        return None

    meta_patterns = [
        # og:image
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
        # twitter:image (name= 또는 property= 둘 다 지원)
        r'<meta[^>]+(?:name|property)=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:name|property)=["\']twitter:image["\']',
    ]
    for pattern in meta_patterns:
        m = re.search(pattern, text)
        if m:
            return m.group(1)

    # 폴백: 본문 첫 의미있는 <img src="https://..."> — icon/logo/avatar 류는 스킵
    for m in re.finditer(r'<img[^>]+src=["\'](https?://[^"\']+)["\']', text, re.IGNORECASE):
        src = m.group(1)
        if any(k in src.lower() for k in _IMG_SKIP_KEYWORDS):
            continue
        return src

    return None


_ARTICLE_NOISE_TAGS = ["script", "style", "nav", "header", "footer", "aside", "form", "iframe"]


def _direct_p_len(el) -> int:
    return sum(len(p.get_text(" ", strip=True)) for p in el.find_all("p", recursive=False))


def extract_article_text(html: str | bytes, max_chars: int = 3000) -> str:
    """기사 HTML 에서 본문 문단만 뽑는다. 직계 <p> 텍스트가 가장 많은 컨테이너를 본문으로 보고,
    그 안의 40자 이상 <p> 만 모은다 — 메뉴·저작권·공유 버튼 문구는 이 길이에 못 미친다.
    첫 <article> 을 믿으면 관련기사 카드에 걸리고(AI타임스), 문서 전체 <p> 를 모으면 배너 문단이
    앞에 붙는다(TechCrunch). readability 류 없이 설치된 bs4 로만. 사이트별 셀렉터는 두지 않는다."""
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(_ARTICLE_NOISE_TAGS):
        tag.decompose()
    root = max(soup.find_all(["article", "main", "section", "div"]), key=_direct_p_len, default=soup)
    paras = (p.get_text(" ", strip=True) for p in root.find_all("p"))
    text = "\n".join(p for p in paras if len(p) >= 40)
    return text[:max_chars]


# 기사 본문 fetch 용. 맨 "Mozilla/5.0" 은 WAF 가 봇으로 점수 매기기 쉽다
_BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept-Language": "ko,en;q=0.8",
}


def fetch_article_text(url: str, max_chars: int = 3000) -> str | None:
    """기사 본문. 네트워크·파싱 실패는 None — 호출부가 RSS 요약으로 폴백한다.
    재시도 없음: 403/429 를 받고 곧장 또 때리면 차단이 길어진다 (AI타임스 2026-09-08 실측)."""
    resp = safe_get(url, timeout=10, retries=1, headers=_BROWSER_HEADERS)
    if resp is None:
        return None
    try:
        return extract_article_text(resp.content, max_chars) or None  # bytes → bs4 가 meta charset 으로 디코딩
    except Exception:
        return None


def now_kst() -> str:
    from zoneinfo import ZoneInfo
    return datetime.now(ZoneInfo("Asia/Seoul")).isoformat()


def today_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def yesterday_kst() -> str:
    from datetime import timedelta
    from zoneinfo import ZoneInfo
    return (datetime.now(ZoneInfo("Asia/Seoul")) - timedelta(days=1)).strftime("%Y-%m-%d")


def fetch_unsplash_image(keyword: str, access_key: str) -> str | None:
    try:
        resp = requests.get(
            "https://api.unsplash.com/photos/random",
            params={"query": keyword, "orientation": "landscape"},
            headers={"Authorization": f"Client-ID {access_key}"},
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json().get("urls", {}).get("regular")
    except Exception:
        return None


def safe_get(url: str, timeout: int = 10, retries: int = 3, delay: int = 2,
             headers: dict | None = None) -> requests.Response | None:
    for attempt in range(retries):
        try:
            resp = requests.get(url, timeout=timeout, headers=headers or {"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            return resp
        except Exception:
            if attempt < retries - 1:
                time.sleep(delay)
    return None
