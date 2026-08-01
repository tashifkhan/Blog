# Pressroom editor

A separate TanStack Start application for writing and publishing blog posts.
It does not add publishing endpoints or GitHub credentials to the public
FastAPI backend.

## Security model

- The editor has its own server runtime and should be deployed as a separate
  project, such as `editor.tashif.codes`.
- Login creates an encrypted, HTTP-only, `SameSite=Strict` session cookie.
- Every publishing API handler validates the session itself.
- Every mutation also validates the request `Origin`.
- A GitHub **personal access token** (`GITHUB_TOKEN`, alias `GITHUB_PAT`) lives
  only in this editor server's environment. Prefer a fine-grained token limited
  to the blog repository with **Contents: Read and write**.
- For a second perimeter, put the deployed URL behind Cloudflare Access (or
  equivalent deployment protection) and allow only your identity.

The built-in login is intentionally a single-owner login. Use a randomly
generated editor password rather than a password reused anywhere else.

Failed sign-ins are throttled per client address and, because `X-Forwarded-For`
is client-supplied and therefore spoofable, under a global ceiling as well.
That throttle is in-process, so it resets on cold starts and is not shared
across instances — treat it as a speed bump, and rely on the deployment
perimeter and a high-entropy password as the real controls.

## Local setup

```bash
cd editor
cp .env.example .env.local
bun install
bun run dev
```

Open `http://localhost:3100`.

Generate independent secrets:

```bash
openssl rand -base64 32
openssl rand -base64 48
```

Use one as `EDITOR_PASSWORD` and the other as `EDITOR_SESSION_SECRET`.
`EDITOR_SESSION_SECRET` must be at least 32 characters.

Set `GITHUB_TOKEN` to a personal access token:

- **Fine-grained:** resource owner = you; repository access = this blog repo
  only; **Contents** = Read and write (metadata read is included).
- **Classic:** `repo` for private blogs, or `public_repo` if the blog is public.

## Publishing API routes

These are TanStack Start server routes in `src/routes/`, not FastAPI routes:

### `GET /api/publish/head`

Returns the current target branch and SHA. The editor reads this **when the tab
opens and whenever it regains focus** — not at publish time — and sends the
retained SHA with the final commit. That is what makes the check meaningful: if
someone pushes while the tab sits open, publishing fails with `409` and the code
`head_stale` instead of building on a commit the writer never saw. The header
shows the retained `branch @ sha`, and the failure offers a "Sync to latest"
action.

### `GET /api/publish/slug?slug=…`

Reports whether `src/blogs/{slug}.md` already exists on the publish branch. The
editor calls this while the slug is being typed, so a collision surfaces next to
the field rather than after every image has been uploaded.

### `GET /api/publish/posts` and `GET /api/publish/posts/:slug`

List and open posts for the desk. Source order:

1. **GitHub** when `GITHUB_TOKEN` is set (matches the publish branch)
2. **Local** monorepo `src/blogs/` (or `BLOGS_DIR`)
3. **Public blog API** (`BLOG_API_BASE`, default `https://blog.tashif.codes/api`)

The response includes `source` and `publishingReady`. Publishing (`POST
/api/publish`) always requires `GITHUB_TOKEN`.

### `POST /api/publish/assets`

Stages one validated AVIF, GIF, JPEG, PNG, or WebP image as an unreferenced Git
blob:

```json
{
  "filename": "architecture.webp",
  "contentBase64": "<base64>"
}
```

The response includes `blobSha`. Staging images separately avoids the 4.5 MB
Vercel Function request limit after base64 expansion. A staged blob is not
public and does not change the branch.

### `POST /api/publish`

Creates one Git tree and one non-force commit containing the Markdown file and
all staged images:

```json
{
  "slug": "React-Native-Architecture",
  "articleContent": "---\ntitle: \"React Native Architecture\"\n---\n\nBody.\n",
  "commitMessage": "content: publish React Native architecture",
  "expectedHeadSha": "0123456789abcdef0123456789abcdef01234567",
  "images": [
    {
      "filename": "architecture.webp",
      "blobSha": "89abcdef0123456789abcdef0123456789abcdef"
    }
  ],
  "overwrite": false
}
```

Publishing a slug that already has a post is destructive — it rewrites that
file wholesale. The server refuses with `409` and the code `slug_exists` unless
`overwrite` is `true`, which the editor only sends after the writer ticks
**Replace the existing post**. `overwrite` defaults to `false`.

The request's commit message is preserved exactly. The request cannot override
the fixed Git author:

```text
tashifkhan <tashifkhan010@gmail.com>
```

The commit writes:

```text
src/blogs/{slug}.md
public/images/blog/{slug}/{filename}
```

The PAT authenticates the API calls. Commits still use the fixed author
`tashifkhan <tashifkhan010@gmail.com>` so GitHub can associate them when that
email is verified on the account.

## Images and `asset:` references

Attaching an image inserts `![alt](asset:filename.png)` — a placeholder that
resolves to `/images/blog/{slug}/{filename}` at publish time. The preview
renders these against the local object URL, and names any reference whose file
is no longer attached rather than showing a broken image. The API rejects a
publish that still contains one. Prose and code are safe: the check matches
`asset:` only when followed by an image filename, so `dataset:cover.png` and a
YAML line reading `asset: ./cover.png` both pass.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `⌘B` / `⌘I` | Bold, italic |
| `⌘K` | Link |
| `⌘E` | Inline code |
| `⌘⇧P` | Toggle write and preview |
| `⌘↵` | Commit and publish |

Heading, list, and quote are line-prefix toggles: they apply to every line the
selection touches and remove the prefix when it is already present.

## Progressive Web App

Pressroom is installable as a standalone app (home screen / desktop). The
build ships:

- `public/manifest.webmanifest` — name, icons, `display: standalone`
- `public/sw.js` — runtime cache for static assets; network-first navigations;
  never caches `/api/*`
- `public/offline.html` — fallback when the desk has no network
- Full favicon set under `public/` + `public/icons/` — `.ico`, SVG, 16/32/48 PNG,
  Apple touch sizes, maskable PWA icons, Safari pinned-tab (regenerate with
  `bun run icons`)

Install from the browser’s install prompt (or “Add to Home Screen” on iOS)
when the editor is served over HTTPS or `localhost`. Service worker updates
activate automatically on the next visit after a deploy.

## Build and run

```bash
bun run test
bun run build
bun run start
```


The Nitro production server listens on `HOST`/`PORT` (defaults `0.0.0.0` /
`3000`; Compose sets `PORT=3100`). Configure a deployment project with
`editor/` as its root directory and keep all variables from `.env.example`
server-side.

## Docker (home-server / Tailscale)

From `editor/`:

```bash
cp .env.example .env   # fill secrets; never commit .env
docker compose up -d --build
```

The container publishes **host port 3100**. On a Tailscale host that is typically:

```text
http://home-server:3100
http://<tailscale-ip>:3100
http://home-server.<tailnet>.ts.net:3100
```

Keep the port off public WAN exposure; Tailscale (or Cloudflare Access) is the
perimeter.
