from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from ..models.comments import Comment


class Heading(BaseModel):
    depth: int = Field(ge=1, le=6)
    text: str
    slug: str


class Outline(BaseModel):
    """
    Metadata a consumer can use before, or instead of, rendering the Markdown.

    Advisory only — the Markdown is the source of truth. `renderer` is the
    component-vocabulary version, so a site whose vendored copy of the renderer
    is older can warn rather than print a raw `<Steps>` into the page.
    """

    renderer: str
    headings: list[Heading] = Field(default_factory=list)
    components: list[str] = Field(default_factory=list)
    word_count: int = Field(default=0, alias="wordCount", ge=0)
    reading_time_minutes: int = Field(default=1, alias="readingTimeMinutes", ge=1)

    model_config = {"populate_by_name": True}


class PostSummary(BaseModel):
    slug: str
    title: str | None = None
    date: str | None = None
    author: str | None = None
    tags: list[str] = Field(default_factory=list)
    excerpt: str | None = None
    cover_image: str | None = Field(default=None, alias="coverImage")
    category: str | None = None
    socials: list[str] | dict[str, Any] | None = None
    word_count: int = Field(default=0, alias="wordCount", ge=0)
    reading_time_minutes: int = Field(
        default=1, alias="readingTimeMinutes", ge=1
    )
    # Enough for a consumer to tell whether it can render a post without
    # fetching the body.
    renderer: str | None = None
    components: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


class PostMetrics(BaseModel):
    views: int = Field(ge=0)
    likes: int = Field(ge=0)
    comments_count: int = Field(ge=0, alias="commentsCount")


class PostFull(BaseModel):
    slug: str
    markdown: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    metrics: PostMetrics
    comments: list[Comment] = Field(default_factory=list)
    renderer: str | None = None
    outline: Outline | None = None


class PostDetailResponse(BaseModel):
    post: PostFull
