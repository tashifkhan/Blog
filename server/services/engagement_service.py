from __future__ import annotations

import asyncio
import random
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
    # Each contended round lets exactly one writer commit, so the ceiling needs
    # to exceed realistic concurrent-reply counts for a single parent comment.
    _MAX_COMMENT_WRITE_ATTEMPTS = 25

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

    async def record_view(self, slug: str, viewer_key: str) -> int:
        """
        Register a view for `viewer_key` and return the post's view count.

        De-duplicated per viewer within `views_window_seconds` by a unique index
        on (slug, viewer) plus a TTL index on expireAt.
        """
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
        except DuplicateKeyError:
            # Already counted for this viewer inside the current window.
            pass
        else:
            await self.posts.update_one({"slug": slug}, {"$inc": {"views": 1}})

        post = await self.posts.find_one({"slug": slug}, {"views": 1, "_id": 0}) or {}
        return int(post.get("views", 0))

    async def get_views(self, slug: str) -> int:
        """Read the view count without recording a new view."""
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

    @staticmethod
    def _add_reply_recursive(
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
                nested, nested_found = EngagementService._add_reply_recursive(
                    list(current.get("replies", [])), target_id, payload
                )
                current["replies"] = nested
                found = found or nested_found
            updated.append(current)

        return updated, found

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

        # Top-level comments are a single atomic push, so concurrent posts can
        # never overwrite one another.
        if not parent_id:
            await self.posts.update_one(
                {"slug": slug},
                {
                    "$push": {"comments": new_comment},
                    "$setOnInsert": {"slug": slug, "views": 0, "likes": 0},
                },
                upsert=True,
            )
            return new_comment

        # Nested replies require a read-modify-write because MongoDB cannot push
        # into an arbitrarily deep array path. Guard it with an optimistic
        # version check and retry, so a concurrent writer can no longer silently
        # clobber the other's comment.
        for _ in range(self._MAX_COMMENT_WRITE_ATTEMPTS):
            post = await self.posts.find_one(
                {"slug": slug}, {"comments": 1, "commentsVersion": 1, "_id": 0}
            )
            if not post:
                raise HTTPException(status_code=404, detail="Parent comment not found")

            version = post.get("commentsVersion")
            updated_comments, found_parent = self._add_reply_recursive(
                post.get("comments", []), parent_id, new_comment
            )
            if not found_parent:
                raise HTTPException(status_code=404, detail="Parent comment not found")

            version_filter = (
                {"$exists": False} if version is None else version
            )
            result = await self.posts.update_one(
                {"slug": slug, "commentsVersion": version_filter},
                {
                    "$set": {"comments": updated_comments},
                    "$inc": {"commentsVersion": 1},
                },
            )
            if result.matched_count:
                return new_comment

            # Someone else wrote first. Back off with jitter before re-reading so
            # concurrent writers don't retry in lockstep.
            await asyncio.sleep(random.uniform(0.005, 0.03))

        raise HTTPException(
            status_code=409,
            detail="Comment thread is busy, please retry",
        )

    async def get_metrics_bulk(self, slugs: list[str]) -> dict[str, dict]:
        """
        Fetch metrics for many posts in one query.

        Replaces per-post get_metrics calls, which made listing endpoints issue
        one round-trip per post.
        """
        if not slugs:
            return {}

        cursor = self.posts.find(
            {"slug": {"$in": slugs}},
            {"slug": 1, "views": 1, "likes": 1, "comments": 1, "_id": 0},
        )
        found = {doc["slug"]: doc async for doc in cursor if doc.get("slug")}

        return {
            slug: {
                "views": int(found.get(slug, {}).get("views", 0)),
                "likes": int(found.get(slug, {}).get("likes", 0)),
                "commentsCount": _count_comments(
                    found.get(slug, {}).get("comments", [])
                ),
            }
            for slug in slugs
        }

    async def get_comments_bulk(self, slugs: list[str]) -> dict[str, list[dict]]:
        """Fetch comment threads for many posts in one query."""
        if not slugs:
            return {}

        cursor = self.posts.find(
            {"slug": {"$in": slugs}}, {"slug": 1, "comments": 1, "_id": 0}
        )
        found = {doc["slug"]: doc.get("comments", []) async for doc in cursor if doc.get("slug")}
        return {slug: found.get(slug, []) for slug in slugs}

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
