from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from models.comments import Comment


class PostSummary(BaseModel):
    slug: str
    title: str | None = None
    date: str | None = None
    author: str | None = None
    tags: list[str] = Field(default_factory=list)
    excerpt: str | None = None
    category: str | None = None
    socials: list[str] | dict[str, Any] | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


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


class PostDetailResponse(BaseModel):
    post: PostFull
