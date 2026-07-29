from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .core.database import close_database, initialize_database
from .routers.engagement import router as engagement_router
from .routers.health import router as health_router
from .routers.posts import router as posts_router
from .routers.system import router as system_router

logger = logging.getLogger(__name__)

settings = get_settings()

API_PREFIX = "/api"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await initialize_database(app=app, settings=settings)

    # Create view-dedup indexes once per process rather than on every request
    # (the previous behaviour cost two extra round-trips per page view).
    db = getattr(app.state, "db", None)
    if db is not None:
        from .services.engagement_service import EngagementService

        try:
            await EngagementService(
                db=db, views_window_seconds=settings.views_window_seconds
            ).ensure_view_indexes()
        except Exception:
            logger.warning("Could not ensure view indexes at startup", exc_info=True)

    try:
        yield
    finally:
        await close_database(app)


# Docs are mounted under the /api prefix. Only /api/* is rewritten to this
# function in production (see vercel.json), so FastAPI's defaults at /docs and
# /redoc were unreachable there and fell through to the Astro 404 page.
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=settings.app_description,
    lifespan=lifespan,
    docs_url=f"{API_PREFIX}/docs",
    redoc_url=f"{API_PREFIX}/redoc",
    openapi_url=f"{API_PREFIX}/openapi.json",
    openapi_tags=[
        {
            "name": "System",
            "description": "Root/system endpoints and links to docs.",
        },
        {
            "name": "Health",
            "description": "Runtime and Mongo connectivity checks.",
        },
        {
            "name": "Engagement",
            "description": "Views, likes, and threaded comments endpoints.",
        },
        {
            "name": "Posts",
            "description": (
                "Blog content endpoints. Includes metadata listing and full markdown "
                "payloads with engagement metrics."
            ),
        },
    ],
)

# Starlette matches allow_origins by exact string; patterns must go through
# allow_origin_regex. The previous "https://*.tashif.codes" entry silently
# never matched anything.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.exact_allowed_origins,
    allow_origin_regex=settings.allowed_origin_regex,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)

app.include_router(system_router, prefix=API_PREFIX)
app.include_router(health_router, prefix=API_PREFIX)
app.include_router(engagement_router, prefix=API_PREFIX)
app.include_router(posts_router, prefix=API_PREFIX)
