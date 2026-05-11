from fastapi import APIRouter

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get("")
async def list_cases() -> list[dict]:
    return []
