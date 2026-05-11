from fastapi import APIRouter

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("")
async def list_courses() -> list[dict]:
    return []
