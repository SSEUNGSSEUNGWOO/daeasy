# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""AI 챔피언 페이지용 비주얼(OG 배경 / 히어로 / 등급 엠블럼 3종)을 로컬 ComfyUI 로 생성.

워크플로우는 scripts/course-thumbs/gen.py 와 동일 (Qwen-Image-Edit 2511 GGUF + Lightning 8-step).
항목마다 크기와 배경 톤(dark/light)이 달라 ITEMS 에 같이 둔다.

  uv run gen.py                  # 전체
  uv run gen.py --only hero --seed 3 --force
"""
from __future__ import annotations

import argparse
import json
import time
import urllib.request
from pathlib import Path

COMFY = "http://127.0.0.1:8188"
HERE = Path(__file__).parent
OUT = HERE / "out"

NO_TEXT = (
    " No text, no letters, no numbers, no logos, no badges, no seals, no certificates, "
    "no watermarks, no people, no faces, no hands."
)
STYLE = {
    # ink-warm(#17150f) 위에 올릴 컷 — 배경을 거의 검게 만들고 가장자리는 compose.py 가 페이드 처리
    "dark": (
        "Flat vector illustration, clean minimal geometric style, on a solid very dark warm "
        "charcoal background that is almost black, palette of cobalt blue, soft light-blue glow, "
        "emerald green and thin white line accents, subtle glow, generous empty dark space around "
        "the subject, centered composition. Subject: {subject}." + NO_TEXT
    ),
    # 흰 패널 위 엠블럼 — 교육과정 썸네일과 같은 톤
    "light": (
        "Flat vector illustration, clean minimal geometric style, soft off-white background, "
        "single centered icon-like subject, generous negative space, subtle long shadow. "
        "Subject: {subject}." + NO_TEXT
    ),
}

# key: (style, width, height, subject)  — 크기는 16 의 배수
ITEMS: dict[str, tuple[str, int, int, str]] = {
    "og-bg": (
        "dark", 1200, 640,
        "three ascending stepped platforms rising from lower-left to upper-right, each platform "
        "carrying a few glowing nodes (green on the first, blue on the second, white on the top), "
        "thin connection lines between nodes, the whole structure placed in the right half of the "
        "frame with the left half left as empty dark space",
    ),
    "hero": (
        "dark", 1024, 1024,
        "an abstract three-tier ascending structure made of translucent geometric slabs stacked "
        "diagonally, glowing nodes in green, blue and white on each tier, thin rising data lines, "
        "a faint silhouette of classical government building columns at the base",
    ),
    "emblem-green": (
        "light", 640, 640,
        "a glowing lightbulb whose light turns into a blueprint document with sketch lines and a "
        "small pencil, emerald green as the main accent color with deep navy outlines",
    ),
    "emblem-blue": (
        "light", 640, 640,
        "gears and code brackets assembling a small application window with a rising chart inside, "
        "cobalt blue as the main accent color with deep navy outlines",
    ),
    "emblem-black": (
        "light", 640, 640,
        "a simple minimal lighthouse tower with a glowing cobalt blue lamp at the top, six clean "
        "straight beams radiating from the lamp to six small dots arranged in a wide circle, "
        "near-black ink as the main color, very few lines, lots of empty space",
    ),
}


def build_workflow(prompt: str, seed: int, w: int, h: int, prefix: str) -> dict:
    return {
        "unet": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": "qwen-image-edit-2511-Q4_K_M.gguf"}},
        "lora": {
            "class_type": "LoraLoaderModelOnly",
            "inputs": {
                "model": ["unet", 0],
                "lora_name": "Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16.safetensors",
                "strength_model": 1.0,
            },
        },
        "clip": {
            "class_type": "CLIPLoader",
            "inputs": {"clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors", "type": "qwen_image", "device": "default"},
        },
        "vae": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "pos": {"class_type": "TextEncodeQwenImageEditPlus", "inputs": {"clip": ["clip", 0], "prompt": prompt, "vae": ["vae", 0]}},
        "neg": {"class_type": "TextEncodeQwenImageEditPlus", "inputs": {"clip": ["clip", 0], "prompt": "", "vae": ["vae", 0]}},
        "latent": {"class_type": "EmptySD3LatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "sampler": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["lora", 0],
                "positive": ["pos", 0],
                "negative": ["neg", 0],
                "latent_image": ["latent", 0],
                "seed": seed,
                "steps": 8,
                "cfg": 1.0,
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": 1.0,
            },
        },
        "decode": {"class_type": "VAEDecode", "inputs": {"samples": ["sampler", 0], "vae": ["vae", 0]}},
        "save": {"class_type": "SaveImage", "inputs": {"images": ["decode", 0], "filename_prefix": prefix}},
    }


def api(path: str, data=None):
    req = urllib.request.Request(COMFY + path)
    if data is not None:
        req.add_header("Content-Type", "application/json")
        req.data = json.dumps(data).encode()
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def generate(key: str, seed: int, out: Path) -> None:
    style, w, h, subject = ITEMS[key]
    wf = build_workflow(STYLE[style].format(subject=subject), seed, w, h, f"champion-{key}")
    prompt_id = api("/prompt", {"prompt": wf})["prompt_id"]
    t0 = time.time()
    while True:
        time.sleep(2)
        hist = api(f"/history/{prompt_id}")
        if prompt_id not in hist:
            continue
        entry = hist[prompt_id]
        if entry.get("status", {}).get("status_str") == "error":
            raise SystemExit(json.dumps(entry["status"], indent=2, ensure_ascii=False))
        if entry.get("outputs"):
            img = entry["outputs"]["save"]["images"][0]
            url = f"{COMFY}/view?filename={img['filename']}&subfolder={img.get('subfolder', '')}&type={img['type']}"
            with urllib.request.urlopen(url) as r:
                out.write_bytes(r.read())
            print(f"  saved {out.name} ({time.time() - t0:.0f}s)")
            return


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*", default=[])
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    keys = args.only or list(ITEMS)
    OUT.mkdir(exist_ok=True)
    for i, key in enumerate(keys, 1):
        out = OUT / f"{key}.png"
        if out.exists() and not args.force:
            print(f"[{i}/{len(keys)}] {key}: skip (exists)")
            continue
        print(f"[{i}/{len(keys)}] {key}")
        generate(key, args.seed, out)


if __name__ == "__main__":
    main()
