from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.supabase import get_supabase

router = APIRouter(prefix="/guides", tags=["guides"])


class GuideVideo(BaseModel):
    title: str | None = None
    url: str
    channel: str | None = None


class GuideImage(BaseModel):
    id: str | None = None
    type: str | None = None
    description: str | None = None
    url: str | None = None


class GuideSummary(BaseModel):
    slug: str
    title: str
    summary: str
    cover_url: str | None = None
    category: str = ""
    difficulty: str = ""
    tags: list[str] = []
    published_at: datetime | None = None


class GuideDetail(GuideSummary):
    body: str = ""
    tldr: list[str] = []
    videos: list[GuideVideo] = []
    images: list[GuideImage] = []
    evaluation_score: float | None = None
    author_name: str | None = None


_LIST_COLUMNS = "slug,title,summary,cover_url,category,difficulty,tags,published_at"
_DETAIL_COLUMNS = (
    _LIST_COLUMNS
    + ",body,tldr,videos,images,evaluation_score,author_name"
)


def _coerce_list(value: Any) -> list:
    return value if isinstance(value, list) else []


@router.get("", response_model=list[GuideSummary])
async def list_guides() -> list[GuideSummary]:
    response = (
        get_supabase()
        .table("guides")
        .select(_LIST_COLUMNS)
        .eq("status", "published")
        .order("published_at", desc=True)
        .execute()
    )
    out: list[GuideSummary] = []
    for row in response.data or []:
        out.append(GuideSummary(
            slug=row["slug"],
            title=row.get("title", ""),
            summary=row.get("summary", ""),
            cover_url=row.get("cover_url"),
            category=row.get("category", ""),
            difficulty=row.get("difficulty", ""),
            tags=_coerce_list(row.get("tags")),
            published_at=row.get("published_at"),
        ))
    return out


@router.get("/{slug}", response_model=GuideDetail)
async def get_guide(slug: str) -> GuideDetail:
    response = (
        get_supabase()
        .table("guides")
        .select(_DETAIL_COLUMNS)
        .eq("slug", slug)
        .eq("status", "published")
        .limit(1)
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="guide not found")
    r = rows[0]
    return GuideDetail(
        slug=r["slug"],
        title=r.get("title", ""),
        summary=r.get("summary", ""),
        cover_url=r.get("cover_url"),
        category=r.get("category", ""),
        difficulty=r.get("difficulty", ""),
        tags=_coerce_list(r.get("tags")),
        published_at=r.get("published_at"),
        body=r.get("body", ""),
        tldr=_coerce_list(r.get("tldr")),
        videos=_coerce_list(r.get("videos")),
        images=_coerce_list(r.get("images")),
        evaluation_score=r.get("evaluation_score"),
        author_name=r.get("author_name"),
    )
