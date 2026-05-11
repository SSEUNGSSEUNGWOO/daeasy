"""
가이드 발행 / 목록 확인

사용법:
  python guides/publish.py list          # 전체 목록 (draft/published 구분)
  python guides/publish.py <slug>        # draft → published 전환
  python guides/publish.py unpublish <slug>  # published → draft 전환
"""

import json
import sys
from pathlib import Path

GUIDES_PATH = Path(__file__).resolve().parents[2] / "frontend" / "content" / "guides.json"


def load() -> list[dict]:
    return json.loads(GUIDES_PATH.read_text(encoding="utf-8"))


def save(guides: list[dict]) -> None:
    GUIDES_PATH.write_text(json.dumps(guides, ensure_ascii=False, indent=2), encoding="utf-8")


def list_guides() -> None:
    guides = load()
    drafts = [g for g in guides if g.get("status") == "draft"]
    published = [g for g in guides if g.get("status", "published") == "published"]

    print(f"\n📝 Draft ({len(drafts)}개)")
    for g in drafts:
        score = g.get("evaluation_score", "-")
        print(f"  · {g['slug']:<35} {g['title']} (평가 {score})")

    print(f"\n✅ Published ({len(published)}개)")
    for g in published:
        print(f"  · {g['slug']:<35} {g['title']}")


def publish(slug: str) -> None:
    guides = load()
    target = next((g for g in guides if g["slug"] == slug), None)
    if not target:
        print(f"슬러그를 찾을 수 없습니다: {slug}")
        sys.exit(1)
    target["status"] = "published"
    save(guides)
    print(f"✅ 발행 완료: {target['title']}")


def unpublish(slug: str) -> None:
    guides = load()
    target = next((g for g in guides if g["slug"] == slug), None)
    if not target:
        print(f"슬러그를 찾을 수 없습니다: {slug}")
        sys.exit(1)
    target["status"] = "draft"
    save(guides)
    print(f"📝 Draft로 전환: {target['title']}")


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] == "list":
        list_guides()
    elif sys.argv[1] == "unpublish":
        if len(sys.argv) < 3:
            print("사용법: python guides/publish.py unpublish <slug>")
            sys.exit(1)
        unpublish(sys.argv[2])
    else:
        publish(sys.argv[1])
