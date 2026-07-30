# @blog/markdown

The canonical Markdown renderer for every surface that displays a post.

## Why this exists

A post is authored once and rendered in three places:

| Surface | Consumes | Was using |
| --- | --- | --- |
| `blog.tashif.codes` | `src/blogs/*.md` at build time | `remark` + `remark-html` + regex passes over the output HTML |
| `tashif.codes` | `GET /api/posts/{slug}/full` at build time | `markdown-it` with its own renderer rules |
| `editor/` reading pane | the in-progress draft | `react-markdown` |

Three parsers meant one post produced three different documents. GitHub-style
callouts rendered as styled panels on the portfolio and as plain blockquotes on
the blog itself, and the blog's `rehype-prism-plus` was registered on a `remark`
pipeline where it silently did nothing. This module is the single
implementation; sites differ only in the class names they pass through
`MarkdownTheme`.

## Why directives instead of MDX

Posts cross the network as Markdown strings. MDX is not a text format — it
compiles to a JS module that imports components and calls them, which needs both
the component source at compile time and a runtime to execute the module.
Neither exists on the consuming side of a JSON API, so `<TwoCol>` in a post body
could never resolve.

Container directives are ordinary block Markdown. The body between the fences is
handed back to the normal block tokenizer, so every renderer rule — headings,
fences, mermaid, callouts, task lists — already applies inside a column:

````markdown
::::two-col{ratio="2:1"}
:::col
#### Primary logic

- Feature A works directly
- Inline code `const x = 10` renders naturally

:::tip Performance
Nested callouts inside columns work.
:::
:::

:::col
```python
def calculate_bounds(data: list[int]) -> tuple[int, int]:
    return min(data), max(data)
```
:::
::::
````

Ratios: `1:1` (default), `2:1`, `1:2`. Callouts: `note`, `tip`, `important`,
`warning`, `caution`, `danger`, each taking an optional title as either
`:::tip Performance` or `:::tip{title="Performance"}`. GitHub's
`> [!NOTE]` blockquote form renders identically, so posts still read correctly
on GitHub.

Nesting works with equal-length fences, but writing the outer fence with one
extra colon (`::::` around `:::`) keeps it unambiguous to a human reader.

## Layout notes

`markdown.css` sizes the two-column grid with a **container query**, not a media
query. The blog renders posts inside resizable desktop windows and a mobile
reader, so a viewport breakpoint would hand a 400px-wide window the
two-column layout. `.md-col` carries `min-width: 0` because a grid item's
default `min-width: auto` resolves against its widest content, and a code block
would otherwise push the track past the container.

## Sync

`editor/`'s Docker build context is `editor/` alone and `tashif.codes` is a
separate repository, so neither can import across a directory boundary. This
directory is therefore the canonical copy and is mirrored by script:

```sh
# from the Blog repo root
bun scripts/sync-markdown.mjs                          # editor only
bun scripts/sync-markdown.mjs ../tashif.codes/src/lib/markdown
bun scripts/sync-markdown.mjs --check ../tashif.codes/src/lib/markdown
```

`--check` exits non-zero on drift and prints which files differ. Edit files
here, never in a mirror; the mirrors carry a generated header saying so.

## Tests

```sh
bun run test          # from the Blog repo root
```
