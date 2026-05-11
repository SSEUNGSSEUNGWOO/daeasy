import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urljoin
from zoneinfo import ZoneInfo

import feedparser
import requests
import yaml
from bs4 import BeautifulSoup

from shared.models import RawItem
from shared.storage import append_raw_items, load_seen_hashes, save_seen_hashes
from shared.utils import yesterday_kst


def recent_dates_kst(days: int) -> set[str]:
    today_kst = datetime.now(ZoneInfo("Asia/Seoul")).date()
    return {(today_kst - timedelta(days=i)).isoformat() for i in range(1, days + 1)}

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; PublicAX-Crawler/1.0)"}


def load_config() -> dict:
    with open(Path(__file__).parent / "config.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def collect_rss(source: dict, seen: set, target_dates: set[str], fallback_pub: str) -> list[RawItem]:
    try:
        resp = requests.get(source["url"], headers=HEADERS, timeout=15)
        feed = feedparser.parse(resp.content)
    except Exception as e:
        print(f"[kr_ai_policy] {source['name']} RSS 실패: {e}")
        return []

    items = []
    keywords = source.get("filter_keywords", [])
    for entry in feed.entries:
        url = getattr(entry, "link", "")
        if not url or url in seen:
            continue
        title = getattr(entry, "title", "").strip()
        if keywords and not any(kw in title for kw in keywords):
            continue
        summary = (getattr(entry, "summary", "") or title).strip()
        published_parsed = getattr(entry, "published_parsed", None)
        pub_str = (
            datetime(*published_parsed[:6], tzinfo=timezone.utc).strftime("%Y-%m-%d")
            if published_parsed else fallback_pub
        )
        if pub_str not in target_dates:
            continue
        items.append(RawItem(
            source_id="kr_ai_policy",
            source_name=source["name"],
            title=title,
            url=url,
            content=summary[:1000],
            published_at=pub_str,
            extra={"region": source.get("region", "국내")},
        ))
        seen.add(url)
    return items


def collect_html(source: dict, seen: set, yesterday: str = "") -> list[RawItem]:
    try:
        resp = requests.get(source["url"], headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        print(f"[kr_ai_policy] {source['name']} HTML 실패: {e}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    selectors = source["selectors"]
    link_base = source.get("link_base", "")
    keywords = source.get("filter_keywords", [])
    items = []

    for row in soup.select(selectors["list"]):
        title_el = row.select_one(selectors["title"])
        link_el = row.select_one(selectors["link"])
        if not title_el or not link_el:
            continue
        title = title_el.get_text(strip=True)
        href = link_el.get("href", "")
        url = urljoin(link_base, href) if link_base else href
        if not url or url in seen:
            continue
        if keywords and not any(kw in title for kw in keywords):
            continue
        items.append(RawItem(
            source_id="kr_ai_policy",
            source_name=source["name"],
            title=title,
            url=url,
            content=title,
            published_at=yesterday or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            extra={"region": source.get("region", "국내")},
        ))
        seen.add(url)
    return items


def run() -> int:
    config = load_config()
    yesterday = yesterday_kst()
    lookback_days = config.get("lookback_days", 3)
    target_dates = recent_dates_kst(lookback_days)
    fallback_pub = max(target_dates)
    seen = load_seen_hashes("kr_ai_policy")
    items = []

    for source in config["sources"]:
        if not source.get("enabled", True):
            continue
        if source["type"] == "rss":
            items.extend(collect_rss(source, seen, target_dates, fallback_pub))
        elif source["type"] == "html":
            items.extend(collect_html(source, seen, yesterday))
        time.sleep(config.get("request_delay_seconds", 1))

    save_seen_hashes("kr_ai_policy", seen)
    count = append_raw_items(items)
    print(f"[kr_ai_policy] {count}개 신규 정책 기사")
    return count
