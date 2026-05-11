from datetime import date

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.supabase import get_supabase

router = APIRouter(prefix="/cases", tags=["cases"])


class CaseSummary(BaseModel):
    slug: str
    title: str
    summary: str
    client_name: str | None = None
    conducted_at: date | None = None
    thumbnail_url: str | None = None


class CaseDetail(CaseSummary):
    description: str = ""


_LIST_COLUMNS = "slug,title,summary,client_name,conducted_at,thumbnail_url"
_DETAIL_COLUMNS = _LIST_COLUMNS + ",description"


@router.get("", response_model=list[CaseSummary])
async def list_cases() -> list[CaseSummary]:
    response = (
        get_supabase()
        .table("cases")
        .select(_LIST_COLUMNS)
        .eq("status", "published")
        .order("conducted_at", desc=True)
        .execute()
    )
    return [CaseSummary(**row) for row in response.data or []]


@router.get("/{slug}", response_model=CaseDetail)
async def get_case(slug: str) -> CaseDetail:
    response = (
        get_supabase()
        .table("cases")
        .select(_DETAIL_COLUMNS)
        .eq("slug", slug)
        .eq("status", "published")
        .limit(1)
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="case not found")
    return CaseDetail(**rows[0])
