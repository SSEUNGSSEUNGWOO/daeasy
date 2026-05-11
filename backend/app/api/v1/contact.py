from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

from app.core.limiter import limiter
from app.core.supabase import get_supabase_admin

router = APIRouter(prefix="/contact", tags=["contact"])


class ContactInquiryRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    company: str | None = Field(default=None, max_length=200)
    course_slug: str | None = Field(default=None, max_length=120)  # frontend 가 slug 로 보냄
    message: str = Field(default="", max_length=4000)


class ContactInquiryResponse(BaseModel):
    id: str


@router.post("/inquiries", response_model=ContactInquiryResponse, status_code=201)
@limiter.limit("5/minute")
async def create_inquiry(request: Request, payload: ContactInquiryRequest) -> ContactInquiryResponse:
    sb = get_supabase_admin()

    course_id: str | None = None
    if payload.course_slug:
        course = (
            sb.table("courses")
            .select("id")
            .eq("slug", payload.course_slug)
            .limit(1)
            .execute()
        )
        if course.data:
            course_id = course.data[0]["id"]

    row = {
        "name": payload.name.strip(),
        "email": payload.email.strip(),
        "phone": payload.phone.strip() if payload.phone else None,
        "company": payload.company.strip() if payload.company else None,
        "course_id": course_id,
        "message": payload.message,
    }
    response = sb.table("contact_inquiries").insert(row).execute()
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=500, detail="failed to create inquiry")
    return ContactInquiryResponse(id=rows[0]["id"])
