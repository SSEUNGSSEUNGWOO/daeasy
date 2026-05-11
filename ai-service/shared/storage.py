import json
from dataclasses import asdict
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

DATA_DIR = Path(__file__).parent.parent / "insights" / "data"
RAW_DIR = DATA_DIR / "raw"
KST = ZoneInfo("Asia/Seoul")


def _today_kst() -> str:
    return datetime.now(KST).strftime("%Y-%m-%d")


def _yesterday_kst() -> str:
    return (datetime.now(KST) - timedelta(days=1)).strftime("%Y-%m-%d")


def _raw_dir_for(date_str: str) -> Path:
    d = RAW_DIR / date_str
    d.mkdir(parents=True, exist_ok=True)
    return d


def load_json(path: Path) -> Any:
    if not path.exists():
        return []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data: Any):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)


# ── seen hashes ──────────────────────────────────────────────

def load_seen_hashes(source_id: str) -> set[str]:
    state = load_json(DATA_DIR / "state.json")
    if isinstance(state, dict):
        return set(state.get(source_id, []))
    return set()


def save_seen_hashes(source_id: str, hashes: set[str]):
    path = DATA_DIR / "state.json"
    state = load_json(path)
    if not isinstance(state, dict):
        state = {}
    state[source_id] = list(hashes)
    save_json(path, state)


# ── raw items ─────────────────────────────────────────────────

def append_raw_items(items: list) -> int:
    if not items:
        return 0
    source_id = items[0].source_id
    raw_path = _raw_dir_for(_today_kst()) / f"{source_id}.json"
    existing = load_json(raw_path)
    if not isinstance(existing, list):
        existing = []
    existing_hashes = {i["item_hash"] for i in existing}
    new_items = [asdict(item) for item in items if item.item_hash not in existing_hashes]
    save_json(raw_path, existing + new_items)
    return len(new_items)


def load_raw_items(today_only: bool = True) -> list[dict]:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    if today_only:
        target_dates = {_yesterday_kst(), _today_kst()}
        dirs = [RAW_DIR / d for d in target_dates if (RAW_DIR / d).exists()]
    else:
        dirs = [d for d in RAW_DIR.iterdir() if d.is_dir()]

    items = []
    for d in dirs:
        for f in d.glob("*.json"):
            data = load_json(f)
            if isinstance(data, list):
                items.extend(data)
    return items


# ── draft ─────────────────────────────────────────────────────

def save_draft(draft: str, cover_image: str | None = None, cover_query: str | None = None):
    save_json(DATA_DIR / "draft.json", {
        "draft": draft,
        "cover_image": cover_image,
        "cover_query": cover_query,
        "date": _today_kst(),
    })


def load_draft() -> str:
    data = load_json(DATA_DIR / "draft.json")
    if isinstance(data, dict):
        return data.get("draft", "")
    return ""


def load_draft_meta() -> dict:
    data = load_json(DATA_DIR / "draft.json")
    return data if isinstance(data, dict) else {}


# ── insights ──────────────────────────────────────────────────

def save_insight(insight):
    path = DATA_DIR / "insights.json"
    existing = load_json(path)
    if not isinstance(existing, list):
        existing = []
    existing.append(asdict(insight))
    save_json(path, existing)
