# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow>=10"]
# ///
"""out/<slug>.png 을 WebP 로 변환해 frontend/public/course-thumbs/ 에 넣고,
courses.thumbnail_url 을 /course-thumbs/<slug>.webp 로 갱신한다.

  uv run publish.py            # 변환 + DB 갱신
  uv run publish.py --no-db    # 변환만
"""
from __future__ import annotations

import argparse
import json
import re
import urllib.request
from pathlib import Path

from PIL import Image

HERE = Path(__file__).parent
OUT = HERE / "out"
FRONTEND = HERE.parent.parent / "frontend"
PUBLIC = FRONTEND / "public" / "course-thumbs"
QUALITY = 82


def load_env() -> dict[str, str]:
    text = (FRONTEND / ".env.local").read_text(encoding="utf-8")
    return {k: v.strip().strip('"') for k, v in re.findall(r"^([A-Z_]+)=(.*)$", text, re.M)}


def convert(slug: str) -> Path:
    src = OUT / f"{slug}.png"
    dst = PUBLIC / f"{slug}.webp"
    Image.open(src).convert("RGB").save(dst, "WEBP", quality=QUALITY, method=6)
    return dst


def update_db(env: dict[str, str], slug: str, url: str) -> None:
    base, key = env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]
    req = urllib.request.Request(
        f"{base}/rest/v1/courses?slug=eq.{slug}",
        data=json.dumps({"thumbnail_url": url}).encode(),
        method="PATCH",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    with urllib.request.urlopen(req) as r:
        rows = json.loads(r.read())
    if len(rows) != 1:
        raise SystemExit(f"{slug}: expected 1 row updated, got {len(rows)}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-db", action="store_true")
    args = ap.parse_args()

    PUBLIC.mkdir(parents=True, exist_ok=True)
    env = {} if args.no_db else load_env()
    slugs = sorted(p.stem for p in OUT.glob("*.png"))
    total = 0
    for slug in slugs:
        dst = convert(slug)
        total += dst.stat().st_size
        url = f"/course-thumbs/{slug}.webp"
        if not args.no_db:
            update_db(env, slug, url)
        print(f"{slug}: {dst.stat().st_size // 1024} KB{'' if args.no_db else ' -> db'}")
    print(f"{len(slugs)} files, {total // 1024} KB total")


if __name__ == "__main__":
    main()
