from __future__ import annotations

import hashlib

from fastapi import APIRouter, Depends, Request

from ..core.config import get_settings
from ..core.dependencies import get_engagement_service
from ..models.comments import CommentCreateResponse, CommentIn, CommentsResponse
from ..models.engagement import LikesResponse, ViewsResponse
from ..services.engagement_service import EngagementService

router = APIRouter(tags=["Engagement"])


def _viewer_key_from_request(request: Request) -> str:
    """
    Stable per-viewer key used only to de-duplicate view counts.

    The raw client IP is salted and hashed rather than stored: the plaintext
    address is never persisted, but the digest is still stable enough to
    de-duplicate within the rolling window.
    """
    forwarded_for = request.headers.get("x-forwarded-for", "")
    ip = (
        (forwarded_for.split(",")[0].strip() if forwarded_for else None)
        or getattr(request.client, "host", None)
        or "unknown"
    )
    user_agent = request.headers.get("user-agent", "")
    salt = get_settings().viewer_hash_salt
    digest = hashlib.sha256(f"{salt}:{ip}:{user_agent}".encode("utf-8")).hexdigest()
    return digest


@router.get(
    "/views/{slug}",
    response_model=ViewsResponse,
    summary="Get views",
    description="Returns the current view count for a post without recording one.",
)
async def get_views(
    slug: str,
    service: EngagementService = Depends(get_engagement_service),
) -> ViewsResponse:
    views = await service.get_views(slug=slug)
    return ViewsResponse(views=views)


@router.post(
    "/views/{slug}",
    response_model=ViewsResponse,
    summary="Record a view",
    description=(
        "Records a view for the calling client and returns the updated count. "
        "De-duplicated per viewer within a rolling window, so repeat calls inside "
        "that window do not increment."
    ),
)
async def record_view(
    slug: str,
    request: Request,
    service: EngagementService = Depends(get_engagement_service),
) -> ViewsResponse:
    viewer_key = _viewer_key_from_request(request)
    views = await service.record_view(slug=slug, viewer_key=viewer_key)
    return ViewsResponse(views=views)


@router.get(
    "/likes/{slug}",
    response_model=LikesResponse,
    summary="Get likes",
    description="Returns the current likes count for a post.",
)
async def get_likes(
    slug: str,
    service: EngagementService = Depends(get_engagement_service),
) -> LikesResponse:
    likes = await service.get_likes(slug=slug)
    return LikesResponse(likes=likes)


@router.post(
    "/likes/{slug}",
    response_model=LikesResponse,
    summary="Like a post",
    description="Increments likes by one and returns updated count.",
)
async def like_post(
    slug: str,
    service: EngagementService = Depends(get_engagement_service),
) -> LikesResponse:
    likes = await service.like_post(slug=slug)
    return LikesResponse(likes=likes)


@router.delete(
    "/likes/{slug}",
    response_model=LikesResponse,
    summary="Unlike a post",
    description=(
        "Decrements likes by one if likes are above zero and returns updated count."
    ),
)
async def unlike_post(
    slug: str,
    service: EngagementService = Depends(get_engagement_service),
) -> LikesResponse:
    likes = await service.unlike_post(slug=slug)
    return LikesResponse(likes=likes)


@router.get(
    "/comments/{slug}",
    response_model=CommentsResponse,
    summary="Get comments",
    description="Returns threaded comments for a post.",
)
async def get_comments(
    slug: str,
    service: EngagementService = Depends(get_engagement_service),
) -> CommentsResponse:
    comments = await service.get_comments(slug=slug)
    return CommentsResponse(comments=comments)


@router.post(
    "/comments/{slug}",
    response_model=CommentCreateResponse,
    summary="Create comment or reply",
    description=(
        "Creates a top-level comment when `parentId` is omitted, or creates a nested "
        "reply when `parentId` references an existing comment id."
    ),
)
async def add_comment(
    slug: str,
    payload: CommentIn,
    service: EngagementService = Depends(get_engagement_service),
) -> CommentCreateResponse:
    new_comment = await service.add_comment(
        slug=slug,
        name=payload.name,
        text=payload.text,
        parent_id=payload.parent_id,
    )
    return CommentCreateResponse(comment=new_comment)
