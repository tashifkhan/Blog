from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException
from pymongo import ASCENDING, ReturnDocument
from pymongo.errors import DuplicateKeyError


def _count_comments(nodes: list[dict]) -> int:
    count = 0
    for node in nodes:
        replies = node.get("replies", [])
        count += 1 + _count_comments(replies)
    return count


class EngagementService:
    def __init__(self, db: Any, views_window_seconds: int = 3600) -> None:
        self.db = db
        self.views_window_seconds = views_window_seconds
        self.posts = db.get_collection("posts")
        self.views_events = db.get_collection("views")

    async def ensure_view_indexes(self) -> None:
        try:
            await self.views_events.create_index(
                [("slug", ASCENDING), ("viewer", ASCENDING)],
                unique=True,
            )
            await self.views_events.create_index("expireAt", expireAfterSeconds=0)
        except Exception:
            return

    async def _ensure_post_exists(self, slug: str) -> None:
        await self.posts.update_one(
            {"slug": slug},
            {
                "$setOnInsert": {
                    "slug": slug,
                    "views": 0,
                    "likes": 0,
                    "comments": [],
                }
            },
            upsert=True,
        )

    async def get_views(self, slug: str, viewer_key: str) -> int:
        await self.ensure_view_indexes()
        await self._ensure_post_exists(slug)

        expire_at = datetime.now(UTC) + timedelta(seconds=self.views_window_seconds)
        try:
            await self.views_events.insert_one(
                {
                    "slug": slug,
                    "viewer": viewer_key,
                    "expireAt": expire_at,
                }
            )
            await self.posts.update_one({"slug": slug}, {"$inc": {"views": 1}})
        except DuplicateKeyError:
            pass
        except Exception:
            pass

        post = await self.posts.find_one({"slug": slug}, {"views": 1, "_id": 0}) or {}
        return int(post.get("views", 0))

    async def get_likes(self, slug: str) -> int:
        post = await self.posts.find_one({"slug": slug}, {"likes": 1, "_id": 0}) or {}
        return int(post.get("likes", 0))

    async def like_post(self, slug: str) -> int:
        res = await self.posts.find_one_and_update(
            {"slug": slug},
            {
                "$inc": {"likes": 1},
                "$setOnInsert": {"slug": slug, "views": 0, "comments": []},
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        if not res:
            res = await self.posts.find_one({"slug": slug})
        return int((res or {}).get("likes", 1))

    async def unlike_post(self, slug: str) -> int:
        res = await self.posts.find_one_and_update(
            {"slug": slug, "likes": {"$gt": 0}},
            {"$inc": {"likes": -1}},
            return_document=ReturnDocument.AFTER,
        )
        if not res:
            res = await self.posts.find_one({"slug": slug})
        likes = int((res or {}).get("likes", 0))
        return max(likes, 0)

    async def get_comments(self, slug: str) -> list[dict]:
        post = (
            await self.posts.find_one({"slug": slug}, {"comments": 1, "_id": 0}) or {}
        )
        return post.get("comments", [])

    async def add_comment(
        self, slug: str, name: str, text: str, parent_id: str | None = None
    ) -> dict:
        new_comment = {
            "id": secrets.token_hex(16),
            "name": name,
            "text": text,
            "date": datetime.now(UTC),
            "replies": [],
        }

        post = await self.posts.find_one({"slug": slug})

        if not post:
            await self.posts.insert_one(
                {
                    "slug": slug,
                    "views": 0,
                    "likes": 0,
                    "comments": [new_comment],
                }
            )
            return new_comment

        if not parent_id:
            await self.posts.update_one(
                {"slug": slug}, {"$push": {"comments": new_comment}}
            )
            return new_comment

        comments = post.get("comments", [])

        def add_reply_recursive(
            nodes: list[dict], target_id: str, payload: dict
        ) -> tuple[list[dict], bool]:
            updated: list[dict] = []
            found = False

            for node in nodes:
                current = dict(node)
                if current.get("id") == target_id:
                    current["replies"] = list(current.get("replies", [])) + [payload]
                    found = True
                else:
                    nested, nested_found = add_reply_recursive(
                        list(current.get("replies", [])), target_id, payload
                    )
                    current["replies"] = nested
                    found = found or nested_found
                updated.append(current)

            return updated, found

        updated_comments, found_parent = add_reply_recursive(
            comments, parent_id, new_comment
        )
        if not found_parent:
            raise HTTPException(status_code=404, detail="Parent comment not found")

        await self.posts.update_one(
            {"slug": slug}, {"$set": {"comments": updated_comments}}
        )
        return new_comment

    async def get_metrics(self, slug: str) -> dict:
        post = await self.posts.find_one(
            {"slug": slug},
            {"views": 1, "likes": 1, "comments": 1, "_id": 0},
        ) or {"views": 0, "likes": 0, "comments": []}

        comments = post.get("comments", [])
        return {
            "views": int(post.get("views", 0)),
            "likes": int(post.get("likes", 0)),
            "commentsCount": _count_comments(comments),
        }
