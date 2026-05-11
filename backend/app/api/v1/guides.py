from fastapi import APIRouter

router = APIRouter(prefix="/guides", tags=["guides"])


@router.get("")
async def list_guides() -> list[dict]:
    return []
