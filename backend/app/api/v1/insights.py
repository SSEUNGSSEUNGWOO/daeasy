import uuid
from datetime import date

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.supabase import get_supabase

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


class InsightDetail(InsightSummary):
    body: str
    sources: list[InsightSource]


class LikeBody(BaseModel):
    user_fingerprint: str | None = None


_LIST_COLUMNS = "slug,title,category,image_url,published_at,tags,view_count"
_DETAIL_COLUMNS = "slug,title,category,image_url,published_at,tags,view_count,body,sources"


@router.get("", response_model=list[InsightSummary])
async def list_insights() -> list[InsightSummary]:
    response = (
        get_supabase()
        .table("insights")
        .select(_LIST_COLUMNS)
        .order("published_at", desc=True)
        .execute()
    )
    return [InsightSummary(**row) for row in response.data or []]


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
async def increment_view(slug: str) -> dict:
    sb = get_supabase()
    existing = sb.table("insights").select("view_count").eq("slug", slug).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="insight not found")
    new_count = (existing.data[0].get("view_count") or 0) + 1
    sb.table("insights").update({"view_count": new_count}).eq("slug", slug).execute()
    return {"views": new_count}


@router.get("/{slug}/likes")
async def get_likes(slug: str) -> dict:
    sb = get_supabase()
    res = sb.table("insight_likes").select("*", count="exact", head=True).eq("slug", slug).execute()
    return {"count": res.count or 0}


@router.post("/{slug}/likes")
async def add_like(slug: str, body: LikeBody | None = None) -> dict:
    sb = get_supabase()
    fingerprint = (body.user_fingerprint if body else None) or str(uuid.uuid4())
    sb.table("insight_likes").insert(
        {"slug": slug, "user_fingerprint": fingerprint}
    ).execute()
    res = sb.table("insight_likes").select("*", count="exact", head=True).eq("slug", slug).execute()
    return {"count": res.count or 0}
