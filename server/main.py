from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from core.database import close_database, initialize_database
from routers.engagement import router as engagement_router
from routers.health import router as health_router
from routers.posts import router as posts_router
from routers.system import router as system_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await initialize_database(app=app, settings=settings)
    try:
        yield
    finally:
        await close_database(app)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=settings.app_description,
    lifespan=lifespan,
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
                "Blog content endpoints. Includes metadata listing and full markdown payloads "
                "with engagement metrics."
            ),
        },
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api"

app.include_router(system_router, prefix=API_PREFIX)
app.include_router(health_router, prefix=API_PREFIX)
app.include_router(engagement_router, prefix=API_PREFIX)
app.include_router(posts_router, prefix=API_PREFIX)
