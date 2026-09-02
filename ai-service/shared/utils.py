import hashlib
import os
import re
import time
import requests
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
