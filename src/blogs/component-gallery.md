---
title: "Component Gallery: Every Building Block in One Post"
date: 2026-08-08
author: "Tashif Ahmad Khan"
socials:
  [
    "https://www.github.com/tashifkhan",
    "https://www.linkedin.com/in/tashif-ahmad-khan-982304244/",
    "https://tashif.codes",
  ]
tags: ["Meta"]
excerpt: "A reference for every document component the Markdown renderer understands — steps, meters, panels, tabs, diagrams and the rest — written in both the tag and the directive spelling."
coverImage: "/images/blog/component-gallery/cover.svg"
---

<Lede>
This post is the reference and the test fixture. Every component the renderer
knows about appears below at least once, so if something breaks on one of the
three sites that render these posts, it breaks here first and visibly.
</Lede>

<Toc />

## why components at all {#why}

Plain Markdown gives you prose, lists, tables and code. That is enough for a
tutorial and not enough for a plan, a comparison, or a postmortem — documents
that want structure the reader can *see* rather than infer.

The renderer adds a closed set of components on top. They are not MDX: nothing
is imported and nothing is evaluated. A tag either resolves against the
registry or it stays ordinary HTML, which is what lets a post travel over the
API as a plain string and still render the same in three places.

<Note title="Two spellings, one result">
Everything here can be written as a tag (`<Steps>`) or as a directive
(`:::steps`). They parse to the same tokens. Tags nest more legibly; directives
survive being read on GitHub, where an unknown tag would simply vanish.
</Note>

## layout {#layout}

### columns

<Cols ratio="2:1">
<Col>
The wide column takes the argument, and the narrow one takes the aside. Below
about 34rem of *container* width — not viewport, because posts render inside
resizable windows — the columns stack and a rule appears between them.

Anything works in here: lists, code, even another component.
</Col>
<Col>
<Panel title="Note to self" tone="muted">
Equal columns: `<Cols cols={2|3|4}>`. Unequal tracks: `ratio` values such as
`1:1`, `2:1`, `1:2`, `1:1:1`, `2:1:1`, `1:1:1:1`. Unknown ratios fall back to
equal columns and fail the publish check.
</Panel>
</Col>
</Cols>

Three equal columns — the feature-card layout:

<Cols cols={3}>
<Col>
<Panel title="Input Modality" icon="arrow-down-left">
- PDF, images (JPG, PNG)
- Single image ≤ 10MB, PDF ≤ 50MB
- Maximum support: 100 pages
</Panel>
</Col>
<Col>
<Panel title="Output Modality" icon="arrow-up-right">
Text / Image Links / MD Documents
</Panel>
</Col>
<Col>
<Panel title="Supported Language" icon="languages">
Chinese, English, French, Spanish, Russian, German, Japanese, Korean, etc.
</Panel>
</Col>
</Cols>

### panels

<Panel title="Setup" icon="settings" tape tilt={-2}>
A panel is the generic card. It takes an optional title, a Lucide-style `icon`,
a strip of masking tape, a tone, and a tilt in degrees.

The tilt is inert unless the host site opts in by setting `--md-rotate: 1`, so
the same post reads as a zine on one site and as a clean article on another.
</Panel>

<Panel title="Heads up" tone="warn" icon="alert-triangle">
Toned panels tint their border and background from the site's own palette
rather than a hardcoded hue. Icons use the same stroke geometry as Lucide /
react-icons lucide set — write `icon="zap"` the way you would import `Zap`.
</Panel>

Standalone icons work anywhere:

<Icon name="rocket" size={28} /> <Icon name="sparkles" /> <Icon name="cpu" />

A strip of tape can also stand on its own, as pure decoration:

<Tape rotate={-6} />

### ink band

<InkBand title="House rules">
An inverted section, for a break in the page. Everything inside follows the
inverted colour rather than the page's, including [links](#layout) and `code`.
</InkBand>

### strips

<Strips>
- Each list item becomes its own card
- With a small alternating nudge, where tilt is enabled
- Good for a set of short, unordered points
</Strips>

## document structure {#structure}

### steps

<Steps>
<Step title="Install">
Run `bun install` and copy `.env.example` to `.env`.
</Step>
<Step title="Configure">
Set `GITHUB_TOKEN` and `EDITOR_SESSION_SECRET`. The secret must be at least 32
characters.

```bash
openssl rand -base64 32
```
</Step>
<Step title="Publish">
Numbering comes from a CSS counter, so inserting a step here would not mean
renumbering the ones below by hand.
</Step>
</Steps>

### phases

<Phases>
<Phase title="Foundation" tag="done" tone="ok">
Registry, tag syntax, validation.
</Phase>
<Phase title="Vocabulary" tag="now" tone="accent">
The components in this post.
</Phase>
<Phase title="Consumers" tag="next" tone="muted">
Blog theme, API manifest, portfolio, editor palette.
</Phase>
</Phases>

### checklist

<Checklist title="Before publish">
- [x] Directives validate
- [x] Images attached
- [ ] Cover image set
</Checklist>

### collapsible detail

<Details summary="Why not just use MDX?">
MDX compiles to JavaScript with arbitrary imports. The API serves Markdown
text, the portfolio fetches it at build time, and the editor's reading pane
renders a string — none of those can evaluate a module. A closed registry keeps
the authoring ergonomics and drops the runtime.
</Details>

## data {#data}

### headline numbers

<Kpi cols={3}>
<Stat value="34" label="components" tone="accent" />
<Stat value="290" label="tests" tone="ok" />
<Stat value="1" label="renderer" />
</Kpi>

### scored rubric

<Meters>
<Meter label="Renderer drift between sites" level="low" score={2}>
One canonical package, mirrored by a script with a `--check` mode that fails on
drift.
</Meter>
<Meter label="Python outline duplicating TS logic" level="mid" score={5}>
Contained by keeping the Python side regex-level and advisory, with a shared
fixture and a version constant asserted in both suites.
</Meter>
<Meter label="Stale mirror on a consuming site" level="high" score={7}>
The `renderer` field lets a consumer notice and warn rather than print a raw
tag into the page.
</Meter>
</Meters>

### bars

<Bars title="Where the lines went">
<Bar label="components.ts" value={720} max={900} tone="accent" />
<Bar label="markdown.css" value={820} max={900} tone="alt" />
<Bar label="validate.ts" value={330} max={900} tone="ok" />
<Bar label="jsx.ts" value={300} max={900} tone="muted" />
</Bars>

<Legend>
- Parser
- Styles
- Checks
</Legend>

## marginalia {#marginalia}

Inline components sit inside a sentence: a <Mark>highlighted phrase</Mark>, a
<Sticker shape="round" tone="ok">NEW</Sticker> stamp, or <Hand>a note in the
margin</Hand> where the handwriting face is enabled.

<Hand>
Standing alone, the same component becomes a block instead — a `span` cannot
hold paragraphs, so the element follows the position.
</Hand>

## media {#media}

### diagrams that markdown would mangle

<Ascii label="Publishing flow from the editor to the two reading sites">
  editor ──▶ POST /api/publish ──▶ GitHub (src/blogs/*.md)
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
            blog.tashif.codes                        tashif.codes
            (renders locally)                      (fetches at build)
</Ascii>

The body of an `Ascii` block is captured verbatim — the alignment, the pipes
and the underscores all survive, which they would not if the content went
through the Markdown parser.

### figures

<Figure caption="A mermaid diagram inside an explicit figure" credit="Generated at render time">

```mermaid
flowchart LR
  A[Markdown] --> B[Registry]
  B --> C[HTML]
  C --> D[Blog]
  C --> E[Portfolio]
  C --> F[Editor]
```

</Figure>

### embeds

Only an allowlisted provider with a pattern-checked id ever becomes a frame,
because this content crosses an API boundary and is rendered by two other
sites.

<Embed type="youtube" id="dQw4w9WgXcQ" title="An allowlisted embed" />

## tabs {#tabs}

<Tabs>
<Tab title="bun">
```bash
bun add @tashif/markdown
```
</Tab>
<Tab title="npm">
```bash
npm install @tashif/markdown
```
</Tab>
<Tab title="pnpm">
```bash
pnpm add @tashif/markdown
```
</Tab>
</Tabs>

Without JavaScript every panel stays visible under its own heading, which reads
as a document rather than as a widget that failed to load.

## the directive spelling {#directives}

Everything above also works with colons, which is what already-published posts
use and what stays readable on GitHub:

:::tip Still supported
`:::tip` and `<Tip>` produce byte-identical HTML. The `two-col` name is kept as
an alias for `Cols` so nothing published before this change had to be edited.
:::

::::two-col{ratio="1:2"}
:::col
**Directive**

```text
:::steps
:::step First
do it
:::
:::
```
:::
:::col
**Tag**

```text
<Steps>
<Step title="First">
do it
</Step>
</Steps>
```
:::
::::

## callouts {#callouts}

:::note
The six callouts predate the registry and are unchanged.
:::

:::warning Careful
A callout takes a title as a bare value or as `{title="..."}`.
:::

<Important>
All six exist: note, tip, important, warning, caution and danger.
</Important>

<Caution>
Each maps to its own colour token, so a site can tune the palette without the
renderer knowing about it.
</Caution>

<Danger>
The tag spelling and the directive spelling produce identical markup.
</Danger>

> [!DANGER]
> The GitHub alert spelling still rewrites into the same markup, so a post reads
> correctly on GitHub as well as on both sites.
