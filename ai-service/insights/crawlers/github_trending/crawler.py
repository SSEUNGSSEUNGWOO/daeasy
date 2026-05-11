import time
from pathlib import Path

import requests
import yaml
from bs4 import BeautifulSoup

from shared.models import RawItem
from shared.storage import append_raw_items, load_seen_hashes, save_seen_hashes
from shared.utils import today_str

HEADERS = {"User-Agent": "Mozilla/5.0"}


def load_config() -> dict:
    with open(Path(__file__).parent / "config.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def scrape_trending(period: str = "daily", languages: list[str] = [""]) -> list[dict]:
    repos = []
    for lang in languages:
        url = f"https://github.com/trending/{lang}?since={period}" if lang else f"https://github.com/trending?since={period}"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
        except Exception as e:
            print(f"[github] {lang or 'all'} fetch 실패: {e}")
            continue

        soup = BeautifulSoup(resp.text, "lxml")
        for article in soup.select("article.Box-row")[:25]:
            h2 = article.select_one("h2.h3 a")
            if not h2:
                continue
            full_name = h2.get("href", "").strip("/")
            desc_tag = article.select_one("p.col-9")
            desc = desc_tag.get_text(strip=True) if desc_tag else ""
            lang_tag = article.select_one("span[itemprop='programmingLanguage']")
            repo_lang = lang_tag.get_text(strip=True) if lang_tag else ""
            stars_tag = article.select_one("a[href$='/stargazers']")
            stars_text = (stars_tag.get_text(strip=True) if stars_tag else "0").replace(",", "")
            try:
                stars = int(stars_text)
            except ValueError:
                stars = 0

            repos.append({
                "full_name": full_name,
                "url": f"https://github.com/{full_name}",
                "description": desc,
                "language": repo_lang,
                "stars": stars,
            })
        time.sleep(1)
    return repos


def run() -> int:
    config = load_config()
    repos = scrape_trending(
        period=config.get("period", "daily"),
        languages=config.get("languages", [""]),
    )
    seen = load_seen_hashes("github_trending")
    items = []

    for repo in repos:
        url = repo["url"]
        if url in seen:
            continue
        items.append(RawItem(
            source_id="github_trending",
            source_name="GitHub Trending",
            title=repo["full_name"],
            url=url,
            content=repo["description"],
            published_at=today_str(),
            extra={"stars": repo["stars"], "language": repo["language"]},
        ))
        seen.add(url)

    save_seen_hashes("github_trending", seen)
    count = append_raw_items(items)
    print(f"[github_trending] {count}개 신규 레포")
    return count
