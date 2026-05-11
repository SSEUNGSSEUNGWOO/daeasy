from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.supabase import get_supabase

router = APIRouter(prefix="/courses", tags=["courses"])


class CourseSummary(BaseModel):
    slug: str
    title: str
    summary: str
    level: str                       # beginner / intermediate / advanced
    duration_hours: int = 0
    price: int | None = None
    thumbnail_url: str | None = None
    sort_order: int = 0


class CourseDetail(CourseSummary):
    description: str = ""


_LIST_COLUMNS = "slug,title,summary,level,duration_hours,price,thumbnail_url,sort_order"
_DETAIL_COLUMNS = _LIST_COLUMNS + ",description"


@router.get("", response_model=list[CourseSummary])
async def list_courses() -> list[CourseSummary]:
    response = (
        get_supabase()
        .table("courses")
        .select(_LIST_COLUMNS)
        .eq("status", "published")
        .order("sort_order")
        .execute()
    )
    return [CourseSummary(**row) for row in response.data or []]


@router.get("/{slug}", response_model=CourseDetail)
async def get_course(slug: str) -> CourseDetail:
    response = (
        get_supabase()
        .table("courses")
        .select(_DETAIL_COLUMNS)
        .eq("slug", slug)
        .eq("status", "published")
        .limit(1)
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="course not found")
    return CourseDetail(**rows[0])
