import uuid
from collections import Counter
from datetime import date

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.core.limiter import limiter
from app.core.supabase import get_supabase, get_supabase_admin

router = APIRouter(prefix="/insights", tags=["insights"])


class InsightSource(BaseModel):
    title: str = ""
    url: str = ""
    source_id: str | None = None


class InsightSummary(BaseModel):
    slug: str
    title: str
    category: str
    image_url: str | None = None
    published_at: date
    tags: list[str] = []
    view_count: int = 0
    like_count: int = 0


class InsightDetail(InsightSummary):
    body: str
    sources: list[InsightSource]


class LikeBody(BaseModel):
    user_fingerprint: str | None = None


_LIST_COLUMNS = "slug,title,category,image_url,published_at,tags,view_count"
_DETAIL_COLUMNS = "slug,title,category,image_url,published_at,tags,view_count,body,sources"


@router.get("", response_model=list[InsightSummary])
async def list_insights() -> list[InsightSummary]:
    sb = get_supabase()
    response = (
        sb.table("insights")
        .select(_LIST_COLUMNS)
        .order("published_at", desc=True)
        .execute()
    )
    likes_res = sb.table("insight_likes").select("slug").execute()
    counts = Counter(r["slug"] for r in (likes_res.data or []))
    return [
        InsightSummary(**row, like_count=counts.get(row["slug"], 0))
        for row in response.data or []
    ]


@router.get("/{slug}", response_model=InsightDetail)
async def get_insight(slug: str) -> InsightDetail:
    response = (
        get_supabase()
        .table("insights")
        .select(_DETAIL_COLUMNS)
        .eq("slug", slug)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="insight not found")
    return InsightDetail(**rows[0])


@router.post("/{slug}/views")
@limiter.limit("60/minute")
async def increment_view(request: Request, slug: str) -> dict:
    """RPC `increment_insight_view` 로 원자 +1. RPC 가 null 반환 = slug 없음."""
    sb = get_supabase_admin()
    res = sb.rpc("increment_insight_view", {"p_slug": slug}).execute()
    new_count = res.data
    if new_count is None:
        raise HTTPException(status_code=404, detail="insight not found")
    return {"views": new_count}


@router.get("/{slug}/likes")
async def get_likes(slug: str) -> dict:
    sb = get_supabase()
    res = sb.table("insight_likes").select("*", count="exact", head=True).eq("slug", slug).execute()
    return {"count": res.count or 0}


@router.post("/{slug}/likes")
@limiter.limit("30/minute")
async def add_like(request: Request, slug: str, body: LikeBody | None = None) -> dict:
    """좋아요 — 무한 허용 정책. 한 사람이 여러 번 눌러도 카운트 +1."""
    sb = get_supabase()
    fingerprint = (body.user_fingerprint if body else None) or str(uuid.uuid4())
    sb.table("insight_likes").insert(
        {"slug": slug, "user_fingerprint": fingerprint}
    ).execute()
    res = sb.table("insight_likes").select("*", count="exact", head=True).eq("slug", slug).execute()
    return {"count": res.count or 0}
