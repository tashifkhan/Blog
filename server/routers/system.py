from fastapi import APIRouter

router = APIRouter(tags=["System"])


@router.get(
    "/",
    summary="API root",
    description="Returns service metadata and links to interactive API docs.",
)
async def root() -> dict[str, str]:
    return {
        "message": "Blog Backend API",
        "docs": "/docs",
        "redoc": "/redoc",
    }
