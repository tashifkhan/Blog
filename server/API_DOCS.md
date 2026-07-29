# Blog Backend API (Modular FastAPI)

This document describes the refactored backend API under `server/`.

The API is now modular and split into:

- `core/` - settings, app config, and database wiring
- `models/` - Pydantic request/response schemas
- `services/` - business logic and data access
- `routers/` - HTTP endpoints grouped by domain

## Tech Stack

- FastAPI
- Pydantic v2 models and validation
- Pydantic Settings (`pydantic-settings`) for environment configuration
- Motor (async MongoDB driver)
- MongoDB (`posts` + `views` collections)

## App Entry Points

- `server/main.py` - primary FastAPI app composition
- `api/index.py` - Vercel Python entrypoint (`from server.main import app`)

## Environment Variables

Set these in `.env` (or deployment env vars):

- `MONGODB_URI` (required for DB-backed routes)
- `MONGODB_DB_NAME` (default: `Blog`)
- `MONGO_SERVER_SELECTION_TIMEOUT_MS` (default: `4000`)
- `VIEWS_WINDOW_SECONDS` (default: `3600`)
- `VIEWER_HASH_SALT` (default: a local-development placeholder; **set this in
  production** — it salts the hashed viewer keys used for view de-duplication)
- `ALLOWED_ORIGINS` (default: `https://*.tashif.codes,https://blog.tashif.codes,https://tashif.codes,http://localhost:4321`, accepts comma-separated list). Entries containing `*` are compiled into a CORS `allow_origin_regex` (one wildcard matches a single label); the rest are passed as exact origins.
- `PROJECT_ROOT` (optional, auto-derived by default)
- `BLOGS_DIR` (optional, overrides `${PROJECT_ROOT}/src/blogs`)

Example:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=Blog
VIEWS_WINDOW_SECONDS=3600
ALLOWED_ORIGINS=https://blog.tashif.codes,http://localhost:4321
```

## Interactive API Docs

When running the app:

- Swagger UI: `/api/docs`
- ReDoc: `/api/redoc`
- OpenAPI JSON: `/api/openapi.json`

These live under the `/api` prefix because `vercel.json` only rewrites `/api/*`
to the Python function; the unprefixed defaults are not routed to it in
production.

## Data Model Overview

### MongoDB Collections

1) `posts`

- Per post document (`slug` is unique key in usage)
- Stores engagement and comments tree
- Shape:

```json
{
  "slug": "CORS-Explained",
  "views": 123,
  "likes": 44,
  "comments": [
    {
      "id": "hex-id",
      "name": "Alice",
      "text": "Great post",
      "date": "2026-03-22T12:00:00+00:00",
      "replies": []
    }
  ]
}
```

2) `views`

- Used for de-duplicated view counting by viewer key
- TTL index on `expireAt` auto-removes windowed events
- Unique index on `(slug, viewer)`

## Endpoint Reference

All routes are mounted at root (no prefix).

### System

#### `GET /`

Returns API metadata and docs links.

Response:

```json
{
  "message": "Blog Backend API",
  "docs": "/api/docs",
  "redoc": "/api/redoc"
}
```

### Health

#### `GET /health`

Returns runtime and DB diagnostics.

Response:

```json
{
  "ok": true,
  "runtime": "3.12",
  "env": { "MONGODB_URI": true },
  "mongo": { "ok": true, "error": null }
}
```

### Engagement

#### `GET /views/{slug}`

- Returns the current view count. Read-only: it does **not** record a view.

Response:

```json
{ "views": 120 }
```

#### `POST /views/{slug}`

- Records a view for the calling client and returns the updated count
- De-duplicated per viewer within `VIEWS_WINDOW_SECONDS`
- The viewer key is a salted SHA-256 digest of the client IP (from
  `x-forwarded-for`, falling back to the socket peer) plus user agent. The raw
  address is never stored — set `VIEWER_HASH_SALT` in production.

Response:

```json
{ "views": 121 }
```

#### `GET /likes/{slug}`

Returns likes count.

```json
{ "likes": 42 }
```

#### `POST /likes/{slug}`

Increments likes.

```json
{ "likes": 43 }
```

#### `DELETE /likes/{slug}`

Decrements likes if > 0.

```json
{ "likes": 42 }
```

#### `GET /comments/{slug}`

Returns full threaded comments tree.

```json
{
  "comments": [
    {
      "id": "0f...",
      "name": "Alice",
      "text": "Nice read",
      "date": "2026-03-22T14:01:02+00:00",
      "replies": []
    }
  ]
}
```

#### `POST /comments/{slug}`

Creates top-level comment or reply.

Request body (top-level):

```json
{
  "name": "Alice",
  "text": "Great article"
}
```

Request body (reply):

```json
{
  "name": "Bob",
  "text": "I agree",
  "parentId": "comment-id-here"
}
```

Response:

```json
{
  "success": true,
  "comment": {
    "id": "new-id",
    "name": "Alice",
    "text": "Great article",
    "date": "2026-03-22T14:11:22+00:00",
    "replies": []
  }
}
```

Validation rules:

- `name`: required, trimmed, length 1..120
- `text`: required, trimmed, length 1..5000
- `parentId`: optional

### Posts

#### `GET /posts.json`

Returns metadata list for all blog files under `src/blogs/*.{md,mdx}`.

Each item contains:

- `slug`
- known frontmatter fields (`title`, `date`, `author`, `tags`, `excerpt`, `category`, `socials`)
- `wordCount` — body word count (frontmatter excluded)
- `readingTimeMinutes` — estimated read time at 200 wpm (`max(1, round(wordCount / 200))`)
- additional `metadata` bag for remaining frontmatter keys

Example response item:

```json
{
  "slug": "CORS-Explained",
  "title": "CORS Explained: Cross-Origin Resource Sharing for Web Developers",
  "date": "2025-09-21",
  "author": "Tashif Ahmad Khan",
  "tags": ["CORS", "API"],
  "excerpt": "Understanding CORS...",
  "category": null,
  "socials": ["https://github.com/..."],
  "wordCount": 1840,
  "readingTimeMinutes": 9,
  "metadata": {}
}
```

#### `GET /posts/{slug}/full`

Returns complete payload for one blog post:

- `slug`
- full `markdown`
- normalized frontmatter `metadata`
- `metrics`: `{ views, likes, commentsCount }`
- `comments`: full threaded comment tree

Example response:

```json
{
  "post": {
    "slug": "CORS-Explained",
    "markdown": "## ...full markdown body...",
    "metadata": {
      "title": "CORS Explained: Cross-Origin Resource Sharing for Web Developers",
      "date": "2025-09-21",
      "author": "Tashif Ahmad Khan"
    },
    "metrics": {
      "views": 120,
      "likes": 42,
      "commentsCount": 10
    },
    "comments": []
  }
}
```

#### `GET /posts/full`

Bulk endpoint that returns the same full payload for all posts.

Useful for:

- content indexing
- search pipeline ingestion
- building static caches with engagement stats

## Dependency Injection Design

Dependencies are resolved in `core/dependencies.py`:

- `get_settings_dependency()` -> typed `Settings`
- `get_engagement_service()` -> `EngagementService` with DB + settings
- `get_posts_service()` -> `PostsService` with blogs path + engagement service

Routers depend on service abstractions rather than directly using Mongo collections.

## Error Handling

- `500 Database is not configured` when Mongo URI/dependency is missing
- `404 Post not found` when slug file does not exist
- `404 Parent comment not found` for invalid reply targets
- `409 Comment thread is busy` when a nested reply loses its optimistic-
  concurrency check repeatedly (retried with backoff before surfacing)
- `422 Unprocessable Entity` for request validation failures

## Local Run

The package uses relative imports, so run it as a package from the **project
root** (not from `server/`):

```bash
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

Then open:

- `http://localhost:8000/api/docs`
- `http://localhost:8000/api/redoc`

To point the Astro frontend at this local backend, set the base **including**
the `/api` prefix:

```env
PUBLIC_API_URL="http://localhost:8000/api"
```

## Migration Notes

- Legacy monolithic implementations in `app.py` and `main.py` were replaced by modular components.
- Existing public endpoints (`/views/{slug}`, `/likes/{slug}`, `/comments/{slug}`, `/posts.json`) remain available.
- New content endpoints added:
  - `/posts/{slug}/full`
  - `/posts/full`
