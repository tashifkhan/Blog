from __future__ import annotations

from fastapi import APIRouter, Depends

from core.dependencies import get_posts_service
from models.posts import PostDetailResponse, PostFull, PostSummary
from services.posts_service import PostsService

router = APIRouter(tags=["Posts"])


@router.get(
    "/posts.json",
    response_model=list[PostSummary],
    summary="List blog post metadata",
    description=(
        "Returns all discovered blog posts with frontmatter metadata and slug. "
        "Results are sorted by date descending."
    ),
)
async def list_posts(
    service: PostsService = Depends(get_posts_service),
) -> list[PostSummary]:
    return await service.list_posts()


@router.get(
    "/posts/debug-paths",
    summary="Debug resolved posts directory",
    description="Returns resolved posts directory and discovered markdown files.",
    include_in_schema=False,
)
async def debug_posts_paths(
    service: PostsService = Depends(get_posts_service),
) -> dict[str, object]:
    resolved = service._resolve_blogs_dir()
    files = service._list_blog_files()
    return {
        "resolvedBlogsDir": str(resolved),
        "exists": resolved.exists(),
        "count": len(files),
        "files": [path.name for path in files],
    }


@router.get(
    "/posts/{slug}/full",
    response_model=PostDetailResponse,
    summary="Get a full blog post",
    description=(
        "Returns full markdown content plus metadata and engagement metrics "
        "(views, likes, comments count) for the selected post slug."
    ),
)
async def get_full_post(
    slug: str,
    service: PostsService = Depends(get_posts_service),
) -> PostDetailResponse:
    post = await service.get_full_post(slug=slug)
    return PostDetailResponse(post=post)


@router.get(
    "/posts/full",
    response_model=list[PostFull],
    summary="List full blog payloads",
    description=(
        "Returns full payload for all posts, including markdown body, slug, "
        "frontmatter metadata, views, likes, and comments count."
    ),
)
async def list_full_posts(
    service: PostsService = Depends(get_posts_service),
) -> list[PostFull]:
    return await service.list_full_posts()
