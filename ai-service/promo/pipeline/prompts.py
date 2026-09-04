# -*- coding: utf-8 -*-
"""프롬프트 템플릿 로드·렌더링.

- prompts/<이름>.md 를 읽고 {{키}} 자리표시자를 치환한다.
  (str.format을 쓰지 않는 이유: 템플릿에 JSON 예시의 중괄호가 들어가기 때문)
- pr-publish의 규격 문서(홍보발행.md 5단계, 헤드라인-규칙.md)를 읽어
  writer/rewriter 프롬프트에 그대로 삽입한다 — 규격의 원본은 pr-publish다.
"""

import re
from pathlib import Path

from .config import prpub_root


def load_prompt(cfg, name: str) -> str:
    """prompts/<name>.md 템플릿 파일을 읽어 문자열로 돌려준다."""
    p = cfg["paths"]["prompts_dir"] / f"{name}.md"
    return p.read_text(encoding="utf-8")


def render(template: str, **kwargs) -> str:
    """템플릿의 {{키}} 자리표시자를 kwargs 값으로 치환한다 (str.format 미사용)."""
    out = template
    for key, value in kwargs.items():
        out = out.replace("{{" + key + "}}", str(value))
    return out


def read_prpub_doc(cfg, rel: str) -> str:
    """pr-publish 프로젝트의 문서를 읽는다 (읽기 전용)."""
    p = prpub_root(cfg) / rel
    return p.read_text(encoding="utf-8") if p.exists() else ""


def writing_spec(cfg) -> str:
    """홍보발행.md의 '## 5. 게시글 작성' 절만 추출한다. 실패 시 전문."""
    doc = read_prpub_doc(cfg, ".claude/commands/홍보발행.md")
    m = re.search(r"(## 5\. 게시글 작성.*?)(?=\n## 6\. )", doc, re.S)
    return m.group(1) if m else doc


def headline_rules(cfg) -> str:
    """pr-publish의 헤드라인 규칙 문서 전문. 없으면 빈 문자열."""
    return read_prpub_doc(cfg, "docs/헤드라인-규칙.md")


def images_list(out_dir: Path) -> str:
    """out/<slug>/images/ 하위 사진 파일 목록을 프롬프트 주입용 문자열로 만든다.

    writer·rewriter·reviewer 프롬프트가 공통으로 쓴다. 폴더·파일이 없으면
    그 사실을 그대로 문자열로 알린다 (없다고 지어내지 않게).
    """
    imgs = out_dir / "images"
    if not imgs.exists():
        return "(images/ 없음)"
    files = sorted(str(p.relative_to(out_dir)) for p in imgs.rglob("*") if p.is_file())
    return "\n".join(f"- {f}" for f in files) if files else "(사진 파일 없음)"


def read_out_file(out_dir: Path, name: str, limit: int = 40000) -> str:
    """out/<slug>/ 산출 파일 내용. 없으면 빈 문자열, 과도하게 길면 앞부분만."""
    f = out_dir / name
    if not f.exists():
        return ""
    text = f.read_text(encoding="utf-8", errors="replace")
    return text[:limit]
