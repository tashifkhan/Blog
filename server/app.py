import os
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# import requests
from pymongo import MongoClient, ASCENDING
from pymongo.errors import DuplicateKeyError

# from dotenv import load_dotenv

# load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
client: Optional[MongoClient] = MongoClient(MONGODB_URI) if MONGODB_URI else None


def get_db():
    if client is None:
        raise HTTPException(status_code=500, detail="MONGODB_URI not configured")
    return client.get_database("Blog")


app = FastAPI(title="Blog Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CommentIn(BaseModel):
    name: str
    text: str
    parentId: Optional[str] = None


class Comment(BaseModel):
    id: str
    name: str
    text: str
    date: Optional[str] = None
    replies: Optional[List["Comment"]] = None


Comment.model_rebuild()


# Root route
@app.get("/")
def root():
    return {"message": "Blog Backend API"}


@app.get("/health")
async def health():
    env = {"MONGODB_URI": bool(MONGODB_URI)}
    mongo = {"ok": False, "error": None}
    try:
        if client:
            client.admin.command({"ping": 1})
            mongo["ok"] = True
    except Exception as e:
        mongo = {"ok": False, "error": str(e)}
    return {"ok": True, "env": env, "mongo": mongo}


# Views: count unique per viewer in a time window
@app.get("/views/{slug}")
async def get_views(slug: str, request: Request):
    db = get_db()
    posts = db.get_collection("posts")
    views_events = db.get_collection("views")

    # indexes
    await _ensure_indexes(views_events)

    posts.update_one(
        {"slug": slug},
        {"$setOnInsert": {"slug": slug, "views": 0, "likes": 0, "comments": []}},
        upsert=True,
    )

    xf = request.headers.get("x-forwarded-for", "")
    ip = (
        (xf.split(",")[0].strip() if xf else None)
        or (getattr(request.client, "host", None))
        or "unknown"
    )
    viewer_key = ip

    window_seconds = 60 * 60
    expire_at = datetime.utcnow() + timedelta(seconds=window_seconds)

    try:
        views_events.insert_one(
            {"slug": slug, "viewer": viewer_key, "expireAt": expire_at}
        )
        posts.update_one({"slug": slug}, {"$inc": {"views": 1}})
    except DuplicateKeyError:
        pass
    except Exception:
        pass

    post = posts.find_one({"slug": slug}, {"views": 1, "_id": 0}) or {}
    return {"views": int(post.get("views", 0))}


async def _ensure_indexes(views_events):
    try:
        views_events.create_index(
            [("slug", ASCENDING), ("viewer", ASCENDING)], unique=True
        )
        views_events.create_index("expireAt", expireAfterSeconds=0)
    except Exception:
        pass


# Likes
@app.get("/likes/{slug}")
async def get_likes(slug: str):
    db = get_db()
    posts = db.get_collection("posts")
    post = posts.find_one({"slug": slug}, {"likes": 1, "_id": 0}) or {}
    return {"likes": int(post.get("likes", 0))}


@app.post("/likes/{slug}")
async def like_post(slug: str):
    db = get_db()
    posts = db.get_collection("posts")
    res = posts.find_one_and_update(
        {"slug": slug},
        {"$inc": {"likes": 1}, "$setOnInsert": {"views": 0, "comments": []}},
        upsert=True,
        return_document=True,
    )
    if not res:
        res = posts.find_one({"slug": slug})
    likes = int((res or {}).get("likes", 1))
    return {"likes": likes}


# Comments
@app.get("/comments/{slug}")
async def get_comments(slug: str):
    db = get_db()
    posts = db.get_collection("posts")
    post = posts.find_one({"slug": slug}, {"comments": 1, "_id": 0}) or {}
    return {"comments": post.get("comments", [])}


@app.post("/comments/{slug}")
async def add_comment(slug: str, payload: CommentIn):
    if not payload.name or not payload.text:
        raise HTTPException(status_code=400, detail="Name and text required")

    db = get_db()
    posts = db.get_collection("posts")

    new_comment = {
        "id": os.urandom(16).hex(),
        "name": payload.name,
        "text": payload.text,
        "date": datetime.utcnow().isoformat(),
        "replies": [],
    }

    post = posts.find_one({"slug": slug})

    if not post:
        posts.insert_one(
            {"slug": slug, "views": 0, "likes": 0, "comments": [new_comment]}
        )
    elif not payload.parentId:
        posts.update_one({"slug": slug}, {"$push": {"comments": new_comment}})
    else:
        comments = post.get("comments", [])

        def add_reply_recursive(nodes):
            updated = []
            for c in nodes:
                c = dict(c)
                if c.get("id") == payload.parentId:
                    c["replies"] = list(c.get("replies", [])) + [new_comment]
                else:
                    c["replies"] = add_reply_recursive(c.get("replies", []))
                updated.append(c)
            return updated

        updated_comments = add_reply_recursive(comments)
        posts.update_one({"slug": slug}, {"$set": {"comments": updated_comments}})

    return {"success": True, "comment": new_comment}


# Posts listing - simplified without frontmatter since it requires file access
@app.get("/posts.json")
async def list_posts():
    return []
