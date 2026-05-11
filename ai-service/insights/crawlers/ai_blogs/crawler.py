from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import feedparser
import yaml

from shared.models import RawItem
from shared.storage import append_raw_items, load_seen_hashes, save_seen_hashes


def load_config() -> dict:
    with open(Path(__file__).parent / "config.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def recent_dates_kst(days: int) -> set[str]:
    today_kst = datetime.now(ZoneInfo("Asia/Seoul")).date()
    return {(today_kst - timedelta(days=i)).isoformat() for i in range(1, days + 1)}


def run() -> int:
    config = load_config()
    sources = config["sources"]
    max_per_source = config.get("max_per_source", 5)
    lookback_days = config.get("lookback_days", 3)
    target_dates = recent_dates_kst(lookback_days)
    fallback_pub = max(target_dates)
    seen = load_seen_hashes("ai_blogs")
    items = []

    for source in sources:
        if not source.get("enabled", True):
            continue
        try:
            feed = feedparser.parse(source["url"])
        except Exception as e:
            print(f"[ai_blogs] {source['name']} 실패: {e}")
            continue

        count = 0
        for entry in feed.entries:
            if count >= max_per_source:
                break
            url = getattr(entry, "link", "")
            if not url or url in seen:
                continue

            title = getattr(entry, "title", "").strip()
            summary = (getattr(entry, "summary", "") or title).strip()
            published_parsed = getattr(entry, "published_parsed", None)
            pub_str = (
                datetime(*published_parsed[:6], tzinfo=timezone.utc).strftime("%Y-%m-%d")
                if published_parsed else fallback_pub
            )
            if pub_str not in target_dates:
                continue

            items.append(RawItem(
                source_id="ai_blogs",
                source_name=source["name"],
                title=title,
                url=url,
                content=summary[:1000],
                published_at=pub_str,
                extra={"company": source.get("company", source["name"])},
            ))
            seen.add(url)
            count += 1

    save_seen_hashes("ai_blogs", seen)
    saved = append_raw_items(items)
    print(f"[ai_blogs] {saved}개 신규 블로그 포스트")
    return saved
