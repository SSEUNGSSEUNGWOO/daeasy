from fastapi import APIRouter, Request
from pydantic import BaseModel, EmailStr

from app.core.limiter import limiter

router = APIRouter(prefix="/newsletter", tags=["newsletter"])


class SubscribeRequest(BaseModel):
    email: EmailStr


@router.post("/subscribe")
@limiter.limit("5/minute")
async def subscribe(request: Request, _payload: SubscribeRequest) -> dict:
    return {"status": "pending"}
