from __future__ import annotations

from datetime import date, datetime
from pathlib import Path
from typing import Any

import frontmatter
from fastapi import HTTPException

from ..models.posts import PostFull, PostMetrics, PostSummary
from ..services.engagement_service import EngagementService
from ..services.outline import RENDERER_VERSION, extract_outline


class PostsService:
    def __init__(
        self,
        blogs_dir: Path,
        engagement_service: EngagementService | None = None,
    ) -> None:
        self.blogs_dir = blogs_dir
        self.engagement_service = engagement_service
        self._resolved_blogs_dir: Path | None = None

    def _resolve_blogs_dir(self) -> Path:
        # Resolution walks the filesystem, so cache it per instance: it was
        # previously re-run for every request and several times per request.
        if self._resolved_blogs_dir is not None:
            return self._resolved_blogs_dir

        candidates: list[Path] = [self.blogs_dir]

        for parent in Path(__file__).resolve().parents:
            candidates.append(parent / "src" / "blogs")

        seen: set[Path] = set()
        resolved_dir = self.blogs_dir
        for candidate in candidates:
            resolved = candidate.resolve()
            if resolved in seen:
                continue
            seen.add(resolved)
            if resolved.exists() and resolved.is_dir():
                resolved_dir = resolved
                break

        self._resolved_blogs_dir = resolved_dir
        return resolved_dir

    def _list_blog_files(self) -> list[Path]:
        # Posts are plain Markdown. `.mdx` used to be globbed here, but the
        # endpoint returns the raw source either way, so an MDX file would have
        # been served as unrendered JSX rather than working as a component.
        return list(self._resolve_blogs_dir().glob("*.md"))

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
    def _extract_summary(
        slug: str,
        metadata: dict[str, Any],
        content: str = "",
    ) -> PostSummary:
        data = dict(metadata)

        title = data.pop("title", None)
        post_date = data.pop("date", None)
        author = data.pop("author", None)
        tags = data.pop("tags", None) or []
        excerpt = data.pop("excerpt", None)
        cover_image = data.pop("coverImage", None) or data.pop("cover_image", None)
        category = data.pop("category", None)
        socials = data.pop("socials", None)
        # Prefer computed body stats over any stale frontmatter keys
        data.pop("wordCount", None)
        data.pop("word_count", None)
        data.pop("readingTimeMinutes", None)
        data.pop("reading_time_minutes", None)

        if isinstance(post_date, (datetime, date)):
            date_value: str | None = post_date.isoformat()
        elif post_date is None:
            date_value = None
        else:
            date_value = str(post_date)

        normalized_tags: list[str] = []
        if isinstance(tags, list):
            normalized_tags = [str(tag) for tag in tags]

        # Via the outline rules rather than a bare `split()`, so a listing and a
        # detail response cannot disagree about how long a post is. Fenced code
        # and component tags are excluded from the count.
        outline = extract_outline(content or "")

        return PostSummary(
            slug=slug,
            title=str(title) if title is not None else None,
            date=date_value,
            author=str(author) if author is not None else None,
            tags=normalized_tags,
            excerpt=str(excerpt) if excerpt is not None else None,
            cover_image=str(cover_image) if cover_image else None,
            category=str(category) if category is not None else None,
            socials=socials,
            word_count=outline["wordCount"],
            reading_time_minutes=outline["readingTimeMinutes"],
            renderer=RENDERER_VERSION,
            components=outline["components"],
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
        blogs_dir = self._resolve_blogs_dir()
        safe_slug = Path(slug).name
        file_path = blogs_dir / f"{safe_slug}.md"
        if file_path.exists() and file_path.is_file():
            return file_path
        raise HTTPException(status_code=404, detail="Post not found")

    async def list_posts(self) -> list[PostSummary]:
        if not self._resolve_blogs_dir().exists():
            return []

        posts: list[PostSummary] = []
        for file_path in self._list_blog_files():
            try:
                loaded = frontmatter.load(str(file_path))
                summary = self._extract_summary(
                    slug=file_path.stem,
                    metadata=dict(loaded.metadata or {}),
                    content=str(loaded.content or ""),
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
                "renderer": RENDERER_VERSION,
                "outline": extract_outline(loaded.content or ""),
            }
        )

    async def list_full_posts(self) -> list[PostFull]:
        """
        Full payload for every post.

        Engagement data is fetched in two bulk queries rather than two queries
        per post, which previously made this endpoint issue ~2N round-trips.
        """
        summaries = await self.list_posts()
        slugs = [summary.slug for summary in summaries]

        metrics_by_slug: dict[str, dict] = {}
        comments_by_slug: dict[str, list[dict[str, Any]]] = {}
        if self.engagement_service is not None and slugs:
            metrics_by_slug = await self.engagement_service.get_metrics_bulk(slugs)
            comments_by_slug = await self.engagement_service.get_comments_bulk(slugs)

        empty_metrics = {"views": 0, "likes": 0, "commentsCount": 0}
        full_posts: list[PostFull] = []

        for summary in summaries:
            try:
                file_path = self._find_file_by_slug(summary.slug)
                loaded = frontmatter.load(str(file_path))
            except Exception:
                continue

            full_posts.append(
                PostFull.model_validate(
                    {
                        "slug": summary.slug,
                        "markdown": loaded.content,
                        "metadata": self._serialize_metadata(
                            dict(loaded.metadata or {})
                        ),
                        "metrics": metrics_by_slug.get(summary.slug, empty_metrics),
                        "comments": comments_by_slug.get(summary.slug, []),
                        "renderer": RENDERER_VERSION,
                        "outline": extract_outline(loaded.content or ""),
                    }
                )
            )

        return full_posts
