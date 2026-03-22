from __future__ import annotations

from datetime import date, datetime
from pathlib import Path
from typing import Any

import frontmatter
from fastapi import HTTPException

from models.posts import PostFull, PostMetrics, PostSummary
from services.engagement_service import EngagementService


class PostsService:
    def __init__(
        self,
        blogs_dir: Path,
        engagement_service: EngagementService | None = None,
    ) -> None:
        self.blogs_dir = blogs_dir
        self.engagement_service = engagement_service

    def _list_blog_files(self) -> list[Path]:
        md_files = list(self.blogs_dir.glob("*.md"))
        mdx_files = list(self.blogs_dir.glob("*.mdx"))
        return md_files + mdx_files

    @staticmethod
    def _serialize_metadata(metadata: dict[str, Any]) -> dict[str, Any]:
        serialized: dict[str, Any] = {}
        for key, value in metadata.items():
            if isinstance(value, (datetime, date)):
                serialized[key] = value.isoformat()
            else:
                serialized[key] = value
        return serialized

    @staticmethod
    def _extract_summary(slug: str, metadata: dict[str, Any]) -> PostSummary:
        data = dict(metadata)

        title = data.pop("title", None)
        post_date = data.pop("date", None)
        author = data.pop("author", None)
        tags = data.pop("tags", None) or []
        excerpt = data.pop("excerpt", None)
        category = data.pop("category", None)
        socials = data.pop("socials", None)

        if isinstance(post_date, (datetime, date)):
            date_value: str | None = post_date.isoformat()
        elif post_date is None:
            date_value = None
        else:
            date_value = str(post_date)

        normalized_tags: list[str] = []
        if isinstance(tags, list):
            normalized_tags = [str(tag) for tag in tags]

        return PostSummary(
            slug=slug,
            title=str(title) if title is not None else None,
            date=date_value,
            author=str(author) if author is not None else None,
            tags=normalized_tags,
            excerpt=str(excerpt) if excerpt is not None else None,
            category=str(category) if category is not None else None,
            socials=socials,
            metadata=PostsService._serialize_metadata(data),
        )

    @staticmethod
    def _parse_date_for_sort(value: str | None) -> datetime:
        if not value:
            return datetime.min
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return datetime.min

    def _find_file_by_slug(self, slug: str) -> Path:
        safe_slug = Path(slug).name
        for extension in (".md", ".mdx"):
            file_path = self.blogs_dir / f"{safe_slug}{extension}"
            if file_path.exists() and file_path.is_file():
                return file_path
        raise HTTPException(status_code=404, detail="Post not found")

    async def list_posts(self) -> list[PostSummary]:
        if not self.blogs_dir.exists():
            return []

        posts: list[PostSummary] = []
        for file_path in self._list_blog_files():
            try:
                loaded = frontmatter.load(str(file_path))
                summary = self._extract_summary(
                    slug=file_path.stem,
                    metadata=dict(loaded.metadata or {}),
                )
                posts.append(summary)
            except Exception:
                continue

        posts.sort(key=lambda post: self._parse_date_for_sort(post.date), reverse=True)
        return posts

    async def get_full_post(self, slug: str) -> PostFull:
        file_path = self._find_file_by_slug(slug)

        try:
            loaded = frontmatter.load(str(file_path))
        except Exception as exc:
            raise HTTPException(
                status_code=500, detail=f"Failed to load post: {exc}"
            ) from exc

        metadata = self._serialize_metadata(dict(loaded.metadata or {}))
        metrics = PostMetrics(views=0, likes=0, commentsCount=0)
        comments_data: list[dict[str, Any]] = []

        if self.engagement_service is not None:
            metrics_data = await self.engagement_service.get_metrics(file_path.stem)
            metrics = PostMetrics.model_validate(metrics_data)
            comments_data = await self.engagement_service.get_comments(file_path.stem)

        return PostFull.model_validate(
            {
                "slug": file_path.stem,
                "markdown": loaded.content,
                "metadata": metadata,
                "metrics": metrics.model_dump(by_alias=True),
                "comments": comments_data,
            }
        )

    async def list_full_posts(self) -> list[PostFull]:
        summaries = await self.list_posts()
        full_posts: list[PostFull] = []

        for summary in summaries:
            try:
                full_posts.append(await self.get_full_post(summary.slug))
            except HTTPException:
                continue

        return full_posts
