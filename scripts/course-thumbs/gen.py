# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""교육과정 썸네일을 로컬 ComfyUI (Qwen-Image-Edit 2511 GGUF + Lightning 8-step) 로 배치 생성.

워크플로우는 personal/instatoon/gen.py 와 동일. 사이즈만 16:9 (1280x720).

  uv run gen.py                       # prompts.json 전체
  uv run gen.py --only ai-literacy sql-basics
  uv run gen.py --seed 7 --force      # 이미 있는 파일도 다시 생성
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
W, H = 1280, 720  # 16 의 배수

# 사이트 팔레트(accent #2563eb / accent-warm #f97316 / ink #0f0f0f) 에 맞춘 공통 스타일
STYLE = (
    "Flat vector illustration, clean minimal geometric style, soft off-white background, "
    "limited palette of deep navy, cobalt blue and a single warm orange accent, "
    "subtle long shadows, generous negative space, centered composition, "
    "professional corporate education course thumbnail. Subject: {subject}. "
    "No text, no letters, no numbers, no logos, no watermarks, no people, no faces, no hands."
)


def build_workflow(prompt: str, seed: int, prefix: str) -> dict:
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
        "latent": {"class_type": "EmptySD3LatentImage", "inputs": {"width": W, "height": H, "batch_size": 1}},
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


def generate(slug: str, subject: str, seed: int, out: Path) -> None:
    wf = build_workflow(STYLE.format(subject=subject), seed, f"course-{slug}")
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

    prompts: dict[str, str] = json.loads((HERE / "prompts.json").read_text(encoding="utf-8"))
    slugs = args.only or list(prompts)
    OUT.mkdir(exist_ok=True)
    for i, slug in enumerate(slugs, 1):
        out = OUT / f"{slug}.png"
        if out.exists() and not args.force:
            print(f"[{i}/{len(slugs)}] {slug}: skip (exists)")
            continue
        print(f"[{i}/{len(slugs)}] {slug}")
        generate(slug, prompts[slug], args.seed, out)


if __name__ == "__main__":
    main()
