from fastapi import APIRouter

router = APIRouter(tags=["System"])


@router.get(
    "/",
    summary="API root",
    description="Returns service metadata and links to interactive API docs.",
)
async def root() -> dict[str, str]:
    # These must match the docs_url/redoc_url configured on the app; the
    # unprefixed /docs and /redoc are not routed to this function in production.
    return {
        "message": "Blog Backend API",
        "docs": "/api/docs",
        "redoc": "/api/redoc",
    }
