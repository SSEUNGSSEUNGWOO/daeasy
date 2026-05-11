from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import feedparser
import yaml

from shared.models import RawItem
from shared.storage import append_raw_items, load_seen_hashes, save_seen_hashes
from shared.utils import fetch_og_image


def load_config() -> dict:
    with open(Path(__file__).parent / "config.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def recent_dates_kst(days: int) -> set[str]:
    today_kst = datetime.now(ZoneInfo("Asia/Seoul")).date()
    return {(today_kst - timedelta(days=i)).isoformat() for i in range(1, days + 1)}


def run() -> int:
    config = load_config()
    sources = config["sources"]
    lookback_days = config.get("lookback_days", 3)
    target_dates = recent_dates_kst(lookback_days)
    fallback_pub = max(target_dates)
    seen = load_seen_hashes("ai_news")
    items = []

    for source in sources:
        if not source.get("enabled", True):
            continue
        try:
            feed = feedparser.parse(source["url"])
        except Exception as e:
            print(f"[ai_news] {source['name']} 실패: {e}")
            continue

        for entry in feed.entries:
            url = getattr(entry, "link", "")
            if not url or url in seen:
                continue

            published_parsed = getattr(entry, "published_parsed", None)
            if published_parsed:
                pub_str = datetime(*published_parsed[:6], tzinfo=timezone.utc).strftime("%Y-%m-%d")
            else:
                pub_str = fallback_pub
            if pub_str not in target_dates:
                continue

            title = getattr(entry, "title", "").strip()
            summary = (getattr(entry, "summary", "") or getattr(entry, "description", "") or title).strip()

            items.append(RawItem(
                source_id="ai_news",
                source_name=source["name"],
                title=title,
                url=url,
                content=summary[:1000],
                published_at=pub_str,
                extra={"feed_name": source["name"]},
            ))
            seen.add(url)

    save_seen_hashes("ai_news", seen)
    count = append_raw_items(items)
    print(f"[ai_news] {count}개 신규 기사")
    return count
