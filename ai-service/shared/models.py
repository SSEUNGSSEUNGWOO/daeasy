from dataclasses import dataclass, field
from datetime import date
from typing import Optional


@dataclass
class RawItem:
    source_id: str        # 크롤러 식별자 (arxiv, github, ai_news, ...)
    source_name: str      # 표시용 이름
    title: str
    url: str
    content: str          # 본문 또는 요약 (원문 그대로)
    published_at: Optional[str] = None
    image_url: Optional[str] = None
    extra: dict = field(default_factory=dict)  # 소스별 추가 데이터
    item_hash: str = ""   # 중복 방지용

    def __post_init__(self):
        if not self.item_hash:
            import hashlib
            self.item_hash = hashlib.sha256(self.url.encode()).hexdigest()[:16]


@dataclass
class Insight:
    title: str
    body: str                  # 마크다운 본문
    sources: list[dict]        # [{"title": ..., "url": ..., "source_id": ...}]
    published_at: str          # YYYY-MM-DD
    category: str = "general"
    image_url: Optional[str] = None
    evaluation_score: Optional[float] = None
    crawled_count: int = 0
    slug: str = ""
    tags: list[str] = field(default_factory=list)

    def __post_init__(self):
        if not self.slug:
            import re
            base = re.sub(r"[^\w\s-]", "", self.title.lower())
            base = re.sub(r"[\s]+", "-", base)[:40]
            self.slug = f"{date.today().isoformat()}-{base}"
