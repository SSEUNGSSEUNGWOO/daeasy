from datetime import date

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.limiter import limiter
from app.core.supabase import get_supabase_admin

router = APIRouter(prefix="/rentals", tags=["rentals"])


class RentalInquiryRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=1, max_length=40)
    usage_date: date | None = None
    time_slot: str | None = Field(default=None, max_length=40)
    message: str = Field(default="", max_length=2000)


class RentalInquiryResponse(BaseModel):
    id: str


@router.post("/inquiries", response_model=RentalInquiryResponse, status_code=201)
@limiter.limit("5/minute")
async def create_inquiry(request: Request, payload: RentalInquiryRequest) -> RentalInquiryResponse:
    row = {
        "name": payload.name.strip(),
        "phone": payload.phone.strip(),
        "usage_date": payload.usage_date.isoformat() if payload.usage_date else None,
        "time_slot": payload.time_slot,
        "message": payload.message,
    }
    response = get_supabase_admin().table("rental_inquiries").insert(row).execute()
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=500, detail="failed to create inquiry")
    return RentalInquiryResponse(id=rows[0]["id"])
