# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow>=10"]
# ///
"""체험관 스테이션 카드 / 404 / 고객센터 일러스트를 로컬 ComfyUI 로 생성해 WebP 로 저장.

  uv run gen.py                      # 전체 (있는 건 건너뜀)
  uv run gen.py --only not-found --seed 7 --force
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent))
from comfy_gen import generate  # noqa: E402

OUT = HERE / "out"
PUBLIC = HERE.parent.parent / "frontend" / "public" / "illust"

# key: (width, height, subject) — 크기는 16 의 배수. 스타일은 전부 light
ITEMS: dict[str, tuple[int, int, str]] = {
    "quiz-report": (
        640, 640,
        "a document report with a magnifying glass over it, a stopwatch and a short checklist "
        "with checkmarks, a few small sparkles, playful and inviting",
    ),
    "quiz-vibe": (
        640, 640,
        "a laptop whose screen shows a simple web app being assembled from colorful building "
        "blocks, code brackets floating beside it, a small rocket taking off, playful and inviting",
    ),
    "not-found": (
        1280, 720,
        "a single white daisy flower standing next to a signpost with empty blank signs, a dashed "
        "winding path that ends abruptly, a small paper plane in the sky, calm and friendly",
    ),
    "support": (
        640, 640,
        "a headset resting on a stack of cards, two chat bubbles floating above, a small lifebuoy "
        "ring, friendly customer support feel",
    ),
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*", default=[])
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    keys = args.only or list(ITEMS)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for i, key in enumerate(keys, 1):
        png = OUT / f"{key}.png"
        if png.exists() and not args.force:
            print(f"[{i}/{len(keys)}] {key}: skip (exists)")
        else:
            print(f"[{i}/{len(keys)}] {key}")
            w, h, subject = ITEMS[key]
            generate("light", subject, w, h, args.seed, png)
        webp = PUBLIC / f"{key}.webp"
        Image.open(png).convert("RGB").save(webp, "WEBP", quality=82, method=6)
        print(f"  -> {webp.relative_to(PUBLIC.parent)} ({webp.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
