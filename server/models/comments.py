from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class CommentIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    text: str = Field(min_length=1, max_length=5000)
    parent_id: str | None = Field(default=None, alias="parentId")

    @field_validator("name", "text")
    @classmethod
    def strip_required_fields(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("must not be empty")
        return normalized


class Comment(BaseModel):
    id: str
    name: str
    text: str
    date: datetime
    replies: list["Comment"] = Field(default_factory=list)


Comment.model_rebuild()


class CommentsResponse(BaseModel):
    comments: list[Comment] = Field(default_factory=list)


class CommentCreateResponse(BaseModel):
    success: bool = True
    comment: Comment
