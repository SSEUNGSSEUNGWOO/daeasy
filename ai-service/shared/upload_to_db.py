"""
기존 JSON 데이터를 DB로 업로드하는 스크립트
Usage: python ai-service/shared/upload_to_db.py
"""
import json
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent.parent
load_dotenv(ROOT / ".env")
sys.path.insert(0, str(Path(__file__).parent.parent))

from shared.db import get_conn

from psycopg2.extras import Json


def upload_insights():
    path = ROOT / "ai-service" / "insights" / "data" / "insights.json"
    if not path.exists():
        print("insights.json 없음, 건너뜀")
        return

    data = json.loads(path.read_text(encoding="utf-8"))

    with get_conn() as conn:
        with conn.cursor() as cur:
            for item in data:
                cur.execute(
                    """
                    INSERT INTO insights (slug, title, body, sources, published_at,
                                          category, image_url, evaluation_score, crawled_count)
                    VALUES (%(slug)s, %(title)s, %(body)s, %(sources)s, %(published_at)s,
                            %(category)s, %(image_url)s, %(evaluation_score)s, %(crawled_count)s)
                    ON CONFLICT (slug) DO UPDATE SET
                        title = EXCLUDED.title,
                        body = EXCLUDED.body,
                        sources = EXCLUDED.sources,
                        published_at = EXCLUDED.published_at,
                        category = EXCLUDED.category,
                        image_url = EXCLUDED.image_url,
                        evaluation_score = EXCLUDED.evaluation_score,
                        crawled_count = EXCLUDED.crawled_count
                    """,
                    {
                        "slug": item["slug"],
                        "title": item["title"],
                        "body": item["body"],
                        "sources": Json(item.get("sources", [])),
                        "published_at": item["published_at"],
                        "category": item.get("category", ""),
                        "image_url": item.get("image_url"),
                        "evaluation_score": item.get("evaluation_score"),
                        "crawled_count": item.get("crawled_count", 0),
                    },
                )
                print(f"  insight: {item['slug']}")
        conn.commit()

    print(f"-> insights {len(data)}개 업로드 완료")


if __name__ == "__main__":
    upload_insights()
