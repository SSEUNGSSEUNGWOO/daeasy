# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow>=10"]
# ///
"""out/*.png 을 사이트에 넣을 형태로 가공한다.

- og-bg.png      → (site)/ai-champion/opengraph-image.jpg  (1200x630, 텍스트 오버레이)
- hero.png       → public/ai-champion/hero-tiers.webp      (가장자리 원형 페이드, 알파 포함)
- emblem-*.png   → public/ai-champion/emblem-*.webp        (320x320)

  uv run compose.py
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).parent
OUT = HERE / "out"
FRONTEND = HERE.parent.parent / "frontend"
PUBLIC = FRONTEND / "public" / "ai-champion"
OG_DIR = FRONTEND / "src" / "app" / "(site)" / "ai-champion"

INK_WARM = (0x17, 0x15, 0x0F)
BLUE_300 = (0x93, 0xC5, 0xFD)
ZINC_300 = (0xD4, 0xD4, 0xD8)


def font(size: int, weight: int = 800) -> ImageFont.FreeTypeFont:
    # Pretendard 는 woff2 뿐이라 Pillow 가 못 읽는다 — 시스템 Noto Sans KR(가변) 로 대체
    try:
        f = ImageFont.truetype("C:/Windows/Fonts/NotoSansKR-VF.ttf", size)
        f.set_variation_by_axes([weight])
        return f
    except OSError:
        return ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", size)


def compose_og() -> None:
    im = Image.open(OUT / "og-bg.png").convert("RGB")
    w, h = im.size
    top = (h - 630) // 2
    im = im.crop((0, top, 1200, top + 630))

    # 왼쪽 텍스트가 읽히도록 좌측을 배경색으로 살짝 눌러준다
    shade = Image.new("L", im.size, 0)
    ImageDraw.Draw(shade).rectangle((0, 0, 560, 630), fill=140)
    shade = shade.filter(ImageFilter.GaussianBlur(120))
    im = Image.composite(Image.new("RGB", im.size, INK_WARM), im, shade)

    d = ImageDraw.Draw(im)
    x = 80
    d.text((x, 150), "행정안전부 · 공공부문 AI 인재 양성·인증", font=font(24, 700), fill=BLUE_300)
    d.text((x, 200), "AI 챔피언 교육", font=font(92, 800), fill="white")
    d.text((x, 330), "Green · Blue · Black 3단계 인증 체계와", font=font(30, 500), fill=ZINC_300)
    d.text((x, 372), "교육 과정, 운영 경험과 범위", font=font(30, 500), fill=ZINC_300)
    d.text((x, 520), "DAEASY", font=font(28, 800), fill="white")

    im.save(OG_DIR / "opengraph-image.jpg", "JPEG", quality=88, optimize=True)
    (OG_DIR / "opengraph-image.alt.txt").write_text(
        "AI 챔피언 교육 — 행정안전부 공공부문 AI 인재 양성·인증, DAEASY", encoding="utf-8"
    )
    print("og:", (OG_DIR / "opengraph-image.jpg").stat().st_size // 1024, "KB")


def compose_hero() -> None:
    im = Image.open(OUT / "hero.png").convert("RGBA")
    size = im.size[0]
    # 중심 62% 까지 불투명, 바깥으로 갈수록 투명 → 히어로 배경색과 자연스럽게 섞인다
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
    mask = mask.resize((int(size * 0.62), int(size * 0.62)))
    full = Image.new("L", (size, size), 0)
    off = (size - mask.size[0]) // 2
    full.paste(mask, (off, off))
    full = full.filter(ImageFilter.GaussianBlur(size * 0.12))
    im.putalpha(full)
    im = im.resize((880, 880), Image.LANCZOS)
    dst = PUBLIC / "hero-tiers.webp"
    im.save(dst, "WEBP", quality=84, method=6)
    print("hero:", dst.stat().st_size // 1024, "KB")


def compose_emblems() -> None:
    for name in ("green", "blue", "black"):
        im = Image.open(OUT / f"emblem-{name}.png").convert("RGB").resize((320, 320), Image.LANCZOS)
        dst = PUBLIC / f"emblem-{name}.webp"
        im.save(dst, "WEBP", quality=84, method=6)
        print(f"emblem-{name}:", dst.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    PUBLIC.mkdir(parents=True, exist_ok=True)
    compose_og()
    compose_hero()
    compose_emblems()
