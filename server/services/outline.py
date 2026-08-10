"""
Document outline: headings, components used, and reading stats.

This mirrors ``packages/markdown/outline.ts``, which is the authoritative
implementation. It exists a second time in Python because the API reads posts
straight off disk as Markdown files and has no JavaScript runtime to call into.

That duplication is deliberately bounded. Everything here is **regex-level and
advisory**: the Markdown remains the source of truth, and every consumer renders
from it with the shared renderer. The outline only lets a client build a table
of contents before paint and decide whether its vendored copy of the renderer is
current. Nothing breaks if this drifts slightly; a post still renders.

What must *not* drift is ``RENDERER_VERSION`` and the component table, so
``server/tests/test_outline.py`` reads both out of the TypeScript source and
asserts they match.
"""

from __future__ import annotations

import re
from typing import Any

# Keep in step with RENDERER_VERSION in packages/markdown/outline.ts.
RENDERER_VERSION = "md-3"

WORDS_PER_MINUTE = 200

# Directives that also accept the GitHub `> [!NOTE]` alert spelling.
CALLOUT_DIRECTIVES = frozenset(
    {"note", "tip", "important", "warning", "caution", "danger"}
)

# Component name -> every spelling that opens it (directive plus aliases).
# Generated from packages/markdown/components.ts; the test asserts parity.
COMPONENT_SPELLINGS: dict[str, tuple[str, ...]] = {
    "Cols": ("cols", "two-col"),
    "Col": ("col",),
    "Note": ("note",),
    "Tip": ("tip",),
    "Important": ("important",),
    "Warning": ("warning",),
    "Caution": ("caution",),
    "Danger": ("danger",),
    "Panel": ("panel",),
    "InkBand": ("ink-band",),
    "Strips": ("strips",),
    "Toc": ("toc",),
    "Steps": ("steps",),
    "Step": ("step",),
    "Phases": ("phases",),
    "Phase": ("phase",),
    "Checklist": ("checklist",),
    "Lede": ("lede",),
    "Meters": ("meters",),
    "Meter": ("meter",),
    "Kpi": ("kpi",),
    "Stat": ("stat",),
    "Bars": ("bars",),
    "Bar": ("bar",),
    "Legend": ("legend",),
    "Sticker": ("sticker",),
    "Hand": ("hand",),
    "Tape": ("tape",),
    "Mark": ("mark",),
    "Figure": ("figure",),
    "Ascii": ("ascii",),
    "Embed": ("embed",),
    "Tabs": ("tabs",),
    "Tab": ("tab",),
    "Details": ("details",),
}

_FRONTMATTER = re.compile(r"\A---\r?\n.*?\r?\n---[ \t]*\r?\n?", re.DOTALL)
_FENCE = re.compile(r"^\s*(`{3,}|~{3,})")
_ATX_HEADING = re.compile(r"^(#{1,6})\s+(.*?)\s*$")
_EXPLICIT_ID = re.compile(r"\s*\{#([^\s{}]+)\}\s*$")
_NON_SLUG = re.compile(r"[^a-z0-9]+")
_WORD = re.compile(r"[A-Za-z0-9À-ɏ]+(?:['’][A-Za-z]+)?")

# Mirrors the strip sequence in `countWords`, in the same order.
_STRIP_FENCED = re.compile(r"^```.*?^```", re.DOTALL | re.MULTILINE)
_STRIP_FENCED_TILDE = re.compile(r"^~~~.*?^~~~", re.DOTALL | re.MULTILINE)
_STRIP_CODE_SPAN = re.compile(r"`[^`\n]*`")
_STRIP_DIRECTIVE = re.compile(r"^\s*:{3,}.*$", re.MULTILINE)
_STRIP_TAG = re.compile(r"</?[A-Za-z][A-Za-z0-9]*(?:\s[^>]*)?/?>")
_STRIP_IMAGE = re.compile(r"!\[[^\]]*\]\([^)]*\)")
_LINK_TEXT = re.compile(r"\[([^\]]*)\]\([^)]*\)")


def strip_frontmatter(source: str) -> str:
    """Drop a leading frontmatter block, which is metadata rather than prose."""
    return _FRONTMATTER.sub("", source, count=1)


def slugify_heading(text: str) -> str:
    return _NON_SLUG.sub("-", text.lower()).strip("-")


def parse_explicit_heading_id(text: str) -> tuple[str, str | None]:
    """Split a Pandoc-style ``## Title {#custom-id}`` into its text and id."""
    match = _EXPLICIT_ID.search(text)
    if not match:
        return text, None
    return text[: match.start()].rstrip(), match.group(1)


def count_words(source: str) -> int:
    """
    Prose word count.

    Fenced code, component tags and directive fences come out first: a post whose
    bulk is a config listing should not read as a thirty-minute article.
    """
    prose = strip_frontmatter(source)
    prose = _STRIP_FENCED.sub(" ", prose)
    prose = _STRIP_FENCED_TILDE.sub(" ", prose)
    prose = _STRIP_CODE_SPAN.sub(" ", prose)
    prose = _STRIP_DIRECTIVE.sub(" ", prose)
    prose = _STRIP_TAG.sub(" ", prose)
    prose = _STRIP_IMAGE.sub(" ", prose)
    prose = _LINK_TEXT.sub(r"\1", prose)
    return len(_WORD.findall(prose))


def reading_time_minutes(word_count: int) -> int:
    if word_count <= 0:
        return 1
    return max(1, round(word_count / WORDS_PER_MINUTE))


def extract_headings(source: str) -> list[dict[str, Any]]:
    """
    ATX headings, with the anchors the renderer emits.

    Only ATX (``## Title``) is recognised, where the TypeScript side goes through
    the real parser and would also see setext headings. That is the one accepted
    gap: setext is vanishingly rare in these posts, and a missing entry costs a
    table of contents one row rather than breaking a page.
    """
    headings: list[dict[str, Any]] = []
    seen: dict[str, int] = {}
    fence: str | None = None

    for line in strip_frontmatter(source).splitlines():
        opener = _FENCE.match(line)
        if opener:
            marker = opener.group(1)[0]
            if fence is None:
                fence = marker
            elif fence == marker:
                fence = None
            continue
        if fence is not None:
            continue

        match = _ATX_HEADING.match(line)
        if not match:
            continue

        text, explicit = parse_explicit_heading_id(match.group(2))
        base = explicit or slugify_heading(text) or "section"
        count = seen.get(base, 0)
        seen[base] = count + 1

        headings.append(
            {
                "depth": len(match.group(1)),
                "text": text,
                "slug": base if count == 0 else f"{base}-{count}",
            }
        )

    return headings


def used_components(source: str) -> list[str]:
    """
    Which registered components does this source use?

    A string scan, in registry order. A component named inside fenced code is a
    false positive, which costs a consumer nothing — the list is advisory, used
    to decide whether to warn about a stale renderer, never to gate rendering.
    """
    body = strip_frontmatter(source)
    found: list[str] = []

    for name, spellings in COMPONENT_SPELLINGS.items():
        tag = re.compile(rf"<{re.escape(name)}(?=[\s/>])", re.IGNORECASE)
        alternatives = "|".join(re.escape(spelling) for spelling in spellings)
        directive = re.compile(
            rf"^\s*:{{3,}}(?:{alternatives})\b", re.IGNORECASE | re.MULTILINE
        )

        # A callout also has the GitHub alert spelling, which the renderer
        # rewrites into the same tokens. A post using only that form still uses
        # the component, so it has to count here too.
        alert = (
            re.compile(
                rf"^\s*>\s*\[!{spellings[0]}\]", re.IGNORECASE | re.MULTILINE
            )
            if spellings[0] in CALLOUT_DIRECTIVES
            else None
        )

        if tag.search(body) or directive.search(body) or (alert and alert.search(body)):
            found.append(name)

    return found


def extract_outline(source: str) -> dict[str, Any]:
    """Everything the API ships alongside the Markdown."""
    words = count_words(source)
    return {
        "renderer": RENDERER_VERSION,
        "headings": extract_headings(source),
        "components": used_components(source),
        "wordCount": words,
        "readingTimeMinutes": reading_time_minutes(words),
    }
