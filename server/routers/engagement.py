from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from core.dependencies import get_engagement_service
from models.comments import CommentCreateResponse, CommentIn, CommentsResponse
from models.engagement import LikesResponse, ViewsResponse
from services.engagement_service import EngagementService

router = APIRouter(tags=["Engagement"])


def _viewer_key_from_request(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    ip = (
        (forwarded_for.split(",")[0].strip() if forwarded_for else None)
        or getattr(request.client, "host", None)
        or "unknown"
    )
    return ip


@router.get(
    "/views/{slug}",
    response_model=ViewsResponse,
    summary="Track and get views",
    description=(
        "Returns current view count for a post and increments views once per viewer "
        "within a rolling de-duplication window."
    ),
)
async def get_views(
    slug: str,
    request: Request,
    service: EngagementService = Depends(get_engagement_service),
) -> ViewsResponse:
    viewer_key = _viewer_key_from_request(request)
    views = await service.get_views(slug=slug, viewer_key=viewer_key)
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
