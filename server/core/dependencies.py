from __future__ import annotations

from typing import Any

from fastapi import Depends, Request

from core.config import Settings, get_settings
from core.database import get_database, get_optional_database
from services.engagement_service import EngagementService
from services.posts_service import PostsService


def get_settings_dependency() -> Settings:
    return get_settings()


def get_engagement_service(
    db: Any = Depends(get_database),
    settings: Settings = Depends(get_settings_dependency),
) -> EngagementService:
    return EngagementService(db=db, views_window_seconds=settings.views_window_seconds)


def get_optional_engagement_service(
    request: Request,
    settings: Settings = Depends(get_settings_dependency),
) -> EngagementService | None:
    db = get_optional_database(request)
    if db is None:
        return None
    return EngagementService(db=db, views_window_seconds=settings.views_window_seconds)


def get_posts_service(
    settings: Settings = Depends(get_settings_dependency),
    engagement_service: EngagementService | None = Depends(
        get_optional_engagement_service
    ),
) -> PostsService:
    return PostsService(
        blogs_dir=settings.resolved_blogs_dir,
        engagement_service=engagement_service,
    )
