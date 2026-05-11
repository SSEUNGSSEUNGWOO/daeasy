import hashlib
import re
import time
import requests
from datetime import datetime, timezone


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


def safe_get(url: str, timeout: int = 10, retries: int = 3, delay: int = 2) -> requests.Response | None:
    for attempt in range(retries):
        try:
            resp = requests.get(url, timeout=timeout, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            return resp
        except Exception:
            if attempt < retries - 1:
                time.sleep(delay)
    return None
