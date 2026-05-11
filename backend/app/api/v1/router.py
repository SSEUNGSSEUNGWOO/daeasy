from fastapi import APIRouter

from app.api.v1 import cases, courses, guides, insights, newsletter

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(courses.router)
api_router.include_router(cases.router)
api_router.include_router(guides.router)
api_router.include_router(insights.router)
api_router.include_router(newsletter.router)


@api_router.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok"}
