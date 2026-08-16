# /// script
# requires-python = ">=3.12"
# dependencies = ["google-genai>=2.17", "python-dotenv"]
# ///
"""daeasy 히어로 배경용 8초 루프 소재를 Veo 3.1 로 생성한다.

사람이 등장하면 AI 아티팩트가 바로 티나므로 세 안 모두 무인(無人) 구도.
오디오는 히어로에서 쓰지 않으므로 generate_audio=False 로 끈다.

  uv run generate.py                    # fast 로 3안 전부
  uv run generate.py --model standard --only A
  uv run generate.py --variants 2       # 안당 2변형 (seed 다르게)
"""
from __future__ import annotations

import argparse
import time
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

HERE = Path(__file__).parent
OUT = HERE / "out"

# 초당 단가(USD, 1080p, 오디오 포함 기준) — 실제 청구는 오디오를 끄면 더 낮을 수 있다.
MODELS = {
    "lite": ("veo-3.1-lite-generate-preview", 0.08),
    "fast": ("veo-3.1-fast-generate-preview", 0.12),
    "standard": ("veo-3.1-generate-preview", 0.40),
}

# 금지 항목. Developer API 는 negative_prompt 를 막아둬서(Vertex 전용)
# 프롬프트 본문 끝에 붙이는 수밖에 없다.
COMMON = (
    " No text, no letters, no captions, no logos, no watermarks. "
    "No camera shake, no cuts, no fast motion."
)
# 무인 컷용 — 사람이 조금이라도 들어오면 바로 티가 난다.
NEG_NO_PEOPLE = " Absolutely no people, no human figures, no hands, no faces." + COMMON
# 손 컷용 — 손은 허용하되 얼굴·몸과 화면 글자를 막는다.
NEG_HANDS = (
    " No face, no head, no torso, no other people. "
    "No legible text, no readable UI, no distorted letters, no warped charts."
) + COMMON

# key -> (프롬프트, 네거티브)
PROMPTS: dict[str, tuple[str, str]] = {
    "A": (
        "Empty modern seminar room at golden hour. Rows of empty chairs and long "
        "desks, large windows on the left casting soft light beams across the floor. "
        "Fine dust particles drifting slowly through the light. Extremely slow smooth "
        "dolly-in. Shallow depth of field, foreground chair softly out of focus. "
        "Muted warm-neutral palette, calm and cinematic. Single continuous take.",
        NEG_NO_PEOPLE,
    ),
    "B": (
        "Macro shot across an empty modern desk: closed laptop, notebook, pen, "
        "ceramic cup, soft morning light from the side. Extremely slow lateral dolly, "
        "very shallow depth of field, creamy bokeh, objects drifting in and out of "
        "focus. Muted neutral palette, calm and premium. Single continuous take.",
        NEG_NO_PEOPLE,
    ),
    "C": (
        "Slow upward camera drift through a bright minimal modern building interior "
        "— glass, pale concrete, soft diffused daylight, clean geometric lines and a "
        "staircase. Extremely slow smooth motion, shallow depth of field. Muted "
        "architectural palette, calm and premium. Single continuous take.",
        NEG_NO_PEOPLE,
    ),
    # 워크샵의 흔적. 빈 강의실을 여러 컷 쓰면 대관 홍보로 읽히므로,
    # "공간"이 아니라 "배움이 일어난 자국"을 잡는다.
    "D": (
        "Close-up of a whiteboard covered with faint hand-drawn diagrams, arrows "
        "and boxes, a few sticky notes on a glass wall in the blurred foreground. "
        "Camera tilts slowly upward. Very shallow depth of field, writing soft and "
        "out of focus, nothing legible. Bright diffused daylight, muted neutral "
        "palette. Single continuous take.",
        NEG_NO_PEOPLE,
    ),
    # 손 컷. AI 영상에서 실패율이 가장 높은 소재라 두 변형으로 위험을 나눈다.
    # H1 은 화면을 보여주되 초점 밖으로 밀어 글자가 읽히지 않게 한다.
    "H1": (
        "Side view at desk level: hands typing slowly on a laptop keyboard. "
        "The screen is visible but far out of focus — only soft glowing shapes of "
        "charts and graphs, colored highlights, nothing legible. Focus is on the "
        "keyboard and hands; hands slightly soft. Only hands and forearms in frame. "
        "Soft window light from the left, creamy bokeh. Slow deliberate finger "
        "movements. Extremely slow lateral camera drift. Muted neutral palette. "
        "Single continuous take.",
        NEG_HANDS,
    ),
    # H2 는 화면을 아예 프레임 밖으로 빼고 빛만 받는다. 안전한 쪽.
    "H2": (
        "Low side angle at desk level: hands typing slowly on a laptop keyboard, "
        "the screen tilted away out of frame so only its soft glow spills onto the "
        "hands and desk surface. Only hands and forearms visible. Soft window light, "
        "very shallow depth of field, creamy bokeh. Slow deliberate finger movements. "
        "Extremely slow lateral camera drift. Muted neutral palette. "
        "Single continuous take.",
        NEG_HANDS,
    ),
}


def generate(client: genai.Client, model: str, key: str, idx: int, args) -> Path:
    dest = OUT / f"{key}-{args.model}-{idx}.mp4"
    print(f"[{key}] #{idx} 생성 요청...")

    operation = client.models.generate_videos(
        model=model,
        prompt=PROMPTS[key][0] + PROMPTS[key][1],
        # Developer API 에서 허용되는 필드는 이 셋뿐. negative_prompt / generate_audio /
        # person_generation / seed 는 전부 Vertex(Enterprise) 전용이라 보내면 즉시 거절된다.
        config=types.GenerateVideosConfig(
            duration_seconds=args.duration,
            aspect_ratio=args.aspect,
            resolution=args.resolution,
        ),
    )

    waited = 0
    while not operation.done:
        time.sleep(10)
        waited += 10
        print(f"[{key}] 대기 {waited}s...")
        operation = client.operations.get(operation)

    if operation.error:
        raise RuntimeError(f"[{key}] 생성 실패: {operation.error}")

    video = operation.response.generated_videos[0].video
    client.files.download(file=video)
    video.save(str(dest))
    print(f"[{key}] 저장 -> {dest}")
    return dest


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--model", choices=list(MODELS), default="fast")
    p.add_argument("--only", help="쉼표 구분 (예: A 또는 A,C). 미지정 시 전부")
    p.add_argument("--variants", type=int, default=1, help="안당 변형 개수")
    p.add_argument("--duration", type=int, choices=[4, 6, 8], default=8)
    p.add_argument("--resolution", choices=["720p", "1080p", "4k"], default="1080p")
    p.add_argument("--aspect", choices=["16:9", "9:16"], default="16:9")
    args = p.parse_args()

    keys = [k.strip().upper() for k in args.only.split(",")] if args.only else list(PROMPTS)
    unknown = [k for k in keys if k not in PROMPTS]
    if unknown:
        raise SystemExit(f"알 수 없는 안: {unknown}. 가능: {list(PROMPTS)}")

    model, rate = MODELS[args.model]
    count = len(keys) * args.variants
    print(
        f"{args.model} / {args.duration}s / {args.resolution} / {args.aspect}\n"
        f"{count}편 생성 — 예상 최대 ${count * args.duration * rate:.2f}\n"
    )

    load_dotenv(HERE / ".env")
    client = genai.Client()  # GEMINI_API_KEY 를 환경에서 읽는다
    OUT.mkdir(exist_ok=True)

    made: list[Path] = []
    for key in keys:
        for i in range(args.variants):
            try:
                made.append(generate(client, model, key, idx=i + 1, args=args))
            except Exception as e:  # 한 편 실패해도 나머지는 계속
                print(f"[{key}] 건너뜀: {e}")

    print(f"\n완료 {len(made)}/{count}편")
    for m in made:
        print(f"  {m}")


if __name__ == "__main__":
    main()
