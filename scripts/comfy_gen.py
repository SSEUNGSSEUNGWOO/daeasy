"""로컬 ComfyUI (Qwen-Image-Edit 2511 GGUF + Lightning 8-step) 텍스트→이미지 공용 모듈.

course-thumbs / ai-champion-visuals 의 gen.py 와 같은 워크플로우. 새 배치 스크립트는
`sys.path.insert(0, str(Path(__file__).resolve().parents[1]))` 뒤 `from comfy_gen import generate` 로 쓴다.
ComfyUI 는 미리 띄워둔다: C:\\dev\\ComfyUI 에서 `.venv\\Scripts\\python.exe main.py`.
"""
from __future__ import annotations

import json
import time
import urllib.request
from pathlib import Path

COMFY = "http://127.0.0.1:8188"

NO_TEXT = (
    " No text, no letters, no numbers, no logos, no badges, no watermarks, "
    "no people, no faces, no hands."
)
STYLE = {
    # 흰/오프화이트 면 위 — 교육과정 썸네일과 같은 톤
    "light": (
        "Flat vector illustration, clean minimal geometric style, soft off-white background, "
        "limited palette of deep navy, cobalt blue and a single warm orange accent, "
        "subtle long shadows, generous negative space, centered composition. "
        "Subject: {subject}." + NO_TEXT
    ),
    # ink-warm(#17150f) 다크 면 위
    "dark": (
        "Flat vector illustration, clean minimal geometric style, on a solid very dark warm "
        "charcoal background that is almost black, palette of cobalt blue, soft light-blue glow, "
        "emerald green and thin white line accents, generous empty dark space around the subject, "
        "centered composition. Subject: {subject}." + NO_TEXT
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


def generate(style: str, subject: str, w: int, h: int, seed: int, out: Path) -> None:
    """style('light'|'dark') 프리픽스 + subject 로 w×h(16 의 배수) 이미지를 생성해 out 에 저장."""
    wf = build_workflow(STYLE[style].format(subject=subject), seed, w, h, out.stem)
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
            out.parent.mkdir(parents=True, exist_ok=True)
            with urllib.request.urlopen(url) as r:
                out.write_bytes(r.read())
            print(f"  saved {out.name} ({time.time() - t0:.0f}s)")
            return
