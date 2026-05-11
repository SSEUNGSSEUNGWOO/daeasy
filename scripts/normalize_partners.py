"""파트너 로고들을 600x200 RGBA 캔버스(AR 3:1)에 중앙정렬·투명패딩 통일.

- SVG는 cairosvg로 충분히 큰 해상도(고스케일)로 래스터화 후 패딩
- 비SVG는 Pillow로 직접 패딩
- 결과: <basename>.png 통일, 원본 확장자 파일 삭제
- 원본 백업은 호출 측에서 _originals/에 미리 복사해둠
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

from PIL import Image

CANVAS_W, CANVAS_H = 600, 200
SVG_RASTER_H = 800  # SVG 래스터 시 기준 높이. 캔버스보다 크게 잡아 다운스케일 → 또렷.

PARTNERS = Path(r"C:\Dev\kbrain\dataeasy\frontend\public\partners")
BACKUP = PARTNERS / "_originals"


def rasterize_svg(svg_path: Path) -> Image.Image:
    from svglib.svglib import svg2rlg
    from reportlab.graphics import renderPM

    drawing = svg2rlg(str(svg_path))
    if drawing is None:
        raise RuntimeError("svg2rlg returned None")
    if drawing.height and drawing.height > 0:
        scale = SVG_RASTER_H / drawing.height
        drawing.width *= scale
        drawing.height *= scale
        drawing.scale(scale, scale)
    # reportlab은 알파 미지원. 흰 배경 RGB로 받음 (사이트 배경도 흰색).
    img = renderPM.drawToPIL(drawing, dpi=72)
    return img.convert("RGBA")


def load_raster(path: Path) -> Image.Image:
    img = Image.open(path)
    # GIF 등 애니메이션은 첫 프레임
    if getattr(img, "is_animated", False):
        img.seek(0)
    return img.convert("RGBA")


def fit_to_canvas(img: Image.Image) -> Image.Image:
    # 사이트 배경이 흰색이라 흰 캔버스로 통일 — 투명 PNG 로고도 흰 배경에 자연스럽게.
    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (255, 255, 255, 255))
    iw, ih = img.size
    scale = min(CANVAS_W / iw, CANVAS_H / ih)
    nw, nh = int(iw * scale), int(ih * scale)
    resized = img.resize((nw, nh), Image.LANCZOS)
    x = (CANVAS_W - nw) // 2
    y = (CANVAS_H - nh) // 2
    canvas.paste(resized, (x, y), resized if resized.mode == "RGBA" else None)
    return canvas


def main() -> int:
    files = [
        f for f in PARTNERS.iterdir()
        if f.is_file() and f.suffix.lower() in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}
    ]
    print(f"[normalize] {len(files)}개 파일 처리")
    for f in sorted(files):
        try:
            if f.suffix.lower() == ".svg":
                img = rasterize_svg(f)
                src_kind = "svg"
            else:
                img = load_raster(f)
                src_kind = "raster"
            out = fit_to_canvas(img)
            target = f.with_suffix(".png")
            out.save(target, "PNG")
            if f.suffix.lower() != ".png":
                f.unlink()
            print(f"  OK  {f.name:24s} -> {target.name} ({src_kind})")
        except Exception as e:
            print(f"  ERR {f.name}: {e!r}")
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
