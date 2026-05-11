from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/newsletter", tags=["newsletter"])


class SubscribeRequest(BaseModel):
    email: EmailStr


@router.post("/subscribe")
async def subscribe(_payload: SubscribeRequest) -> dict:
    return {"status": "pending"}
