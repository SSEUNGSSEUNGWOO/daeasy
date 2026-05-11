import io
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

import feedparser
import yaml

from shared.models import RawItem
from shared.storage import append_raw_items, load_seen_hashes, save_seen_hashes


def load_config() -> dict:
    with open(Path(__file__).parent / "config.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def fetch_entries(config: dict) -> list:
    keywords = config["keywords"]
    fields = config.get("search_fields", ["ti", "abs"])
    max_results = config.get("max_results", 30)
    lookback_days = config.get("lookback_days", 3)
    groups = ["(" + " OR ".join(f'{field}:"{kw}"' for field in fields) + ")" for kw in keywords]
    query = " OR ".join(groups)

    end = datetime.now(timezone.utc) - timedelta(days=1)
    start = end - timedelta(days=lookback_days - 1)
    full_query = f"({query}) AND submittedDate:[{start.strftime('%Y%m%d')}000000 TO {end.strftime('%Y%m%d')}235959]"

    url = (
        f"https://export.arxiv.org/api/query"
        f"?search_query={urllib.parse.quote(full_query, safe='')}"
        f"&max_results={max_results}&sortBy=submittedDate&sortOrder=descending"
    )
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            return feedparser.parse(io.BytesIO(resp.read())).entries
    except Exception as e:
        print(f"[arxiv] fetch 실패: {e}")
        return []


def run() -> int:
    config = load_config()
    entries = fetch_entries(config)
    seen = load_seen_hashes("arxiv")

    items = []
    for entry in entries:
        raw_id = entry.id.split("/abs/")[-1].split("v")[0]
        url = f"https://arxiv.org/abs/{raw_id}"
        if url in seen:
            continue
        items.append(RawItem(
            source_id="arxiv",
            source_name="arXiv",
            title=" ".join(entry.title.split()),
            url=url,
            content=(getattr(entry, "summary", "") or "").strip(),
            published_at=(getattr(entry, "published", "") or "")[:10],
            extra={"authors": [a.name for a in getattr(entry, "authors", [])][:5]},
        ))
        seen.add(url)

    save_seen_hashes("arxiv", seen)
    count = append_raw_items(items)
    print(f"[arxiv] {count}개 신규 논문")
    return count
