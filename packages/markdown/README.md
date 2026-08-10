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

Equal columns: `<Cols cols={2|3|4}>` (default 2). Unequal tracks via `ratio`:
`1:1`, `2:1`, `1:2`, `1:1:1`, `2:1:1`, `1:2:1`, `1:1:2`, `1:1:1:1`, and a few
more. Callouts: `note`, `tip`, `important`, `warning`, `caution`, `danger`,
each taking an optional title as either `:::tip Performance` or
`:::tip{title="Performance"}`. GitHub's `> [!NOTE]` blockquote form renders
identically, so posts still read correctly on GitHub.

Panels (and steps, phases, stats) accept a Lucide-style `icon` attribute —
`icon="arrow-up-right"`, `icon="languages"`, `icon="zap"` — rendered as inline
SVG so no icon package is required at render time. A standalone `<Icon name="…">`
tag is also available.

Nesting works with equal-length fences, but writing the outer fence with one
extra colon (`::::` around `:::`) keeps it unambiguous to a human reader.

## Images

Sizing uses Obsidian's suffix, so a note drafted in Obsidian renders the same
once pasted in:

```markdown
![A diagram|400](/images/blog/post/diagram.png)      width only
![A diagram|400x260](/images/blog/post/diagram.png)  width and height
```

The numbers become real `width`/`height` attributes, which give the browser an
aspect ratio before the bytes arrive so a sized image does not shift the page as
it loads. `max-width: 100%` still scales it down inside a narrow column, and
`height: auto` keeps the ratio while it does — a 900px image in a 300px column
renders at 300px wide, not squashed.

A pipe is legal in alt text, so the suffix only applies when digits follow it:
`![Rock|Paper](x.png)` keeps its alt text.

Images work inside columns, and combine with sizing:

````markdown
::::two-col{ratio="1:1"}
:::col
![Before|300](/images/blog/post/before.png)
:::
:::col
![After|300](/images/blog/post/after.png)
:::
::::
````

An image alone in its paragraph becomes a `<figure>` with the alt text as its
caption. An image inside a sentence stays a bare inline `<img>` with no caption
and no frame — a caption under an inline icon reads as nonsense, and `<figure>`
is not valid inside `<p>`.

## Layout notes

Below the two-column breakpoint the columns stack, and a rule is drawn between
them — without it the split the author wrote is invisible and the two columns
read as one continuous block of prose. The rule disappears once they sit side by
side, where the gap already communicates it.

Callouts and columns are themed per site: `blog.tashif.codes` draws a callout as
a small system dialog with a full-width title bar and a hard offset shadow, to
match its desktop metaphor, while `tashif.codes` uses a soft rounded panel on
its shadow scale with a mono uppercase label. Both come from the same markup.

`markdown.css` sizes the two-column grid with a **container query**, not a media
query. The blog renders posts inside resizable desktop windows and a mobile
reader, so a viewport breakpoint would hand a 400px-wide window the
two-column layout. `.md-col` carries `min-width: 0` because a grid item's
default `min-width: auto` resolves against its widest content, and a code block
would otherwise push the track past the container.

## Components

Beyond plain Markdown the renderer understands a closed set of components,
described once in `components.ts`. That table is the single source of truth for
the parsers, the renderer, the validator and the editor's insert palette, so
adding a component is one entry rather than four edits.

### Two spellings

Every component can be written as a JSX-style tag or as a `:::` directive. Both
parse to the same tokens and produce byte-identical HTML.

```md
<Cols ratio="2:1">
<Col>left</Col>
<Col>right</Col>
</Cols>

::::cols{ratio="2:1"}
:::col
left
:::
:::col
right
:::
::::
```

Tags nest by name, so they avoid the colon-counting that `::::`/`:::` requires.
Directives survive being read on GitHub, where an unrecognised tag would simply
not display. Already-published posts use the directive form, and `two-col` is
kept as an alias for `Cols`, so nothing had to be rewritten.

**This is not MDX.** There is no import, no component scope and no expression
evaluation — `score={8}` is read as the literal `8`, never evaluated. A tag
resolves against the registry or it stays raw HTML. That is deliberate: posts
travel to the API, two sites and the editor as plain strings, and a construct
needing a component scope could never be resolved on the consuming side.

### Attributes

```md
<Panel title="Setup" tape tilt={-2} tone="warn">
<Meter label="Leak risk" level="high" score={8}>why</Meter>
<Note>Heads up</Note>            <!-- positional: maps to `title` -->
:::note Heads up                 <!-- same, in directive form -->
```

A bare attribute (`tape`) is boolean true. Values may be quoted, braced, or
unquoted. Each component names one attribute as *positional*, which is what
lets `:::tip Performance` work without braces.

### The vocabulary

| Group | Components |
| --- | --- |
| Layout | `Cols` / `Col`, `Panel`, `InkBand`, `Strips` |
| Structure | `Toc`, `Steps` / `Step`, `Phases` / `Phase`, `Checklist`, `Lede`, `Details` |
| Data | `Meters` / `Meter`, `Kpi` / `Stat`, `Bars` / `Bar`, `Legend` |
| Marginalia | `Sticker`, `Hand`, `Tape`, `Mark`, `Icon` |
| Media | `Figure`, `Ascii`, `Embed` |
| Interaction | `Tabs` / `Tab` |
| Callouts | `Note`, `Tip`, `Important`, `Warning`, `Caution`, `Danger` |

`src/blogs/component-gallery.md` in the Blog repo exercises all of them and
doubles as the visual regression fixture.

A few behaviours worth knowing:

- **`Toc`** builds itself from the document's own headings, including explicit
  `{#id}` anchors, so its links always match what the renderer emitted.
- **`Ascii`** captures its body verbatim. Alignment, pipes and underscores
  survive, which they would not if the content went through the parser. Its
  `label` is required and becomes the `aria-label`.
- **`Embed`** accepts only an allowlisted provider with a pattern-checked id,
  never a URL. The content crosses an API boundary and is rendered by two other
  sites, so an arbitrary author-supplied `src` is not on offer.
- **`Tabs`** has its strip built client-side by `client.ts`, because a
  component's `render` sees only its own attributes and the buttons need the
  titles of siblings. Without JavaScript every panel stays visible under its
  own heading — a readable document rather than a broken widget.
- **`Hand`** and `Sticker` render a `span` inline and a `div` when they stand
  alone, since a `span` cannot hold paragraphs.

### Theming

Structural classes (`md-step`, `md-meter`, …) live in `markdown.css` and are
driven entirely by `--md-*` custom properties. Sites map those onto their own
tokens; `MarkdownTheme` additionally injects per-slot class names for hosts that
want utilities.

Three tokens carry the zine look and are **off by default**, so the same post
reads as a designed artifact on one site and a clean article on another without
the Markdown changing:

| Token | Default | Turns on |
| --- | --- | --- |
| `--md-rotate` | `0` | Panel/sticker/strip tilt |
| `--md-hand-font` | `inherit` | Handwritten marginalia |
| `--md-panel-shadow` | `none` | Hard offset shadows |

### Validation

`validateDocument()` walks the registry and reports unknown components and
attributes, bad enum values, missing required attributes, wrong parents, child
counts, unclosed and crossed tags, and a block tag buried mid-line (which would
otherwise render as raw HTML). Inline code spans are masked first, so a post
that documents the components does not flag itself.

It is dependency-free — the editor's publish route imports it server-side
without pulling in a parser — and runs both on every keystroke in the editor and
as a publish gate.

### Outline

`extractOutline()` returns the headings, the components used, a word count and a
reading time, plus `RENDERER_VERSION`. This is what the API ships alongside the
Markdown so a consumer can build a table of contents before paint and can tell
whether its vendored mirror is current. `server/services/outline.py` asserts the
same version constant, so a vocabulary bump cannot ship to only half the
pipeline.

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
