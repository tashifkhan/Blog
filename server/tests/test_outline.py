"""
Parity between the Python outline and the TypeScript one it mirrors.

`server/services/outline.py` exists because the API has no JavaScript runtime,
which means the same rules are written twice. These tests are what stops the two
from drifting: the version constant and the component table are read straight
out of the TypeScript source and compared, and the behavioural cases below match
the ones in `packages/markdown/outline.test.ts`.

    pip install -r requirements-dev.txt
    pytest server/tests
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from server.services.outline import (
    COMPONENT_SPELLINGS,
    RENDERER_VERSION,
    count_words,
    extract_headings,
    extract_outline,
    used_components,
)

REPO_ROOT = Path(__file__).resolve().parents[2]
COMPONENTS_TS = REPO_ROOT / "packages" / "markdown" / "components.ts"
OUTLINE_TS = REPO_ROOT / "packages" / "markdown" / "outline.ts"
GALLERY = REPO_ROOT / "src" / "blogs" / "component-gallery.md"


# ---------------------------------------------------------------------------
# Drift guards
# ---------------------------------------------------------------------------


def test_renderer_version_matches_typescript() -> None:
    source = OUTLINE_TS.read_text(encoding="utf-8")
    match = re.search(r"RENDERER_VERSION\s*=\s*'([^']+)'", source)
    assert match, "could not find RENDERER_VERSION in outline.ts"
    assert match.group(1) == RENDERER_VERSION, (
        "RENDERER_VERSION differs between outline.ts and outline.py. "
        "A vocabulary bump has to ship to both halves of the pipeline."
    )


def _typescript_component_spellings() -> dict[str, tuple[str, ...]]:
    """Pull name/directive/aliases out of the registry, in declaration order."""
    source = COMPONENTS_TS.read_text(encoding="utf-8")

    # The six callouts are built by a helper rather than written out, so they
    # are reconstructed the same way the helper does.
    callouts = re.search(
        r"export const CALLOUT_NAMES = \[(.*?)\] as const", source, re.DOTALL
    )
    assert callouts, "could not find CALLOUT_NAMES in components.ts"
    callout_names = re.findall(r"'([a-z]+)'", callouts.group(1))

    spellings: dict[str, tuple[str, ...]] = {}
    entry = re.compile(
        r"^\s{4}name: '(?P<name>[A-Za-z]+)',\n"
        r"\s{4}directive: '(?P<directive>[a-z-]+)',\n"
        r"(?:\s{4}aliases: \[(?P<aliases>[^\]]*)\],\n)?",
        re.MULTILINE,
    )

    for match in entry.finditer(source):
        aliases = re.findall(r"'([a-z-]+)'", match.group("aliases") or "")
        spellings[match.group("name")] = (match.group("directive"), *aliases)

        # `...CALLOUT_NAMES.map(calloutSpec)` sits directly after `Col`.
        if match.group("name") == "Col":
            for callout in callout_names:
                spellings[callout.capitalize()] = (callout,)

    return spellings


def test_component_table_matches_the_registry() -> None:
    parsed = _typescript_component_spellings()
    assert parsed, "failed to parse any components out of components.ts"
    assert parsed == COMPONENT_SPELLINGS, (
        "COMPONENT_SPELLINGS in outline.py is out of step with components.ts. "
        "Regenerate it from the registry."
    )


# ---------------------------------------------------------------------------
# Behaviour, mirroring packages/markdown/outline.test.ts
# ---------------------------------------------------------------------------


def test_counts_prose() -> None:
    assert count_words("one two three") == 3


def test_ignores_frontmatter() -> None:
    assert count_words('---\ntitle: "A long descriptive title"\n---\nbody') == 1


def test_ignores_fenced_code() -> None:
    source = "intro\n\n```js\nconst a = 1\nconst b = 2\n```\n\nend"
    assert count_words(source) == 2


def test_ignores_component_tags_but_keeps_their_body() -> None:
    assert count_words('<Note title="Ignored heading">real body text</Note>') == 3


def test_ignores_directive_fences() -> None:
    assert count_words(":::tip Some title\nbody here\n:::") == 2


def test_keeps_link_text_but_drops_the_url() -> None:
    assert count_words("see [the docs](https://example.com/a/b/c)") == 3


def test_drops_image_markup() -> None:
    assert count_words("![a diagram of things](/images/x.png)") == 0


def test_finds_tag_syntax() -> None:
    assert used_components("<Cols>\n<Col>a</Col>\n<Col>b</Col>\n</Cols>") == [
        "Cols",
        "Col",
    ]


def test_finds_directive_syntax_including_aliases() -> None:
    assert used_components("::::two-col\n:::col\na\n:::\n::::") == ["Cols", "Col"]


def test_reports_each_component_once() -> None:
    assert used_components(":::note\na\n:::\n:::note\nb\n:::") == ["Note"]


def test_does_not_match_a_component_name_in_prose() -> None:
    assert used_components("I wrote some Notes about Cols today.") == []


def test_headings_carry_the_anchors_the_renderer_emits() -> None:
    source = "# Intro\n\n## Details {#deep-dive}\n\n## Details\n"
    assert extract_headings(source) == [
        {"depth": 1, "text": "Intro", "slug": "intro"},
        {"depth": 2, "text": "Details", "slug": "deep-dive"},
        {"depth": 2, "text": "Details", "slug": "details"},
    ]


def test_dedupes_repeated_headings() -> None:
    slugs = [h["slug"] for h in extract_headings("## Same\n\n## Same\n")]
    assert slugs == ["same", "same-1"]


def test_skips_headings_inside_fenced_code() -> None:
    assert extract_headings("```md\n# Not a heading\n```\n\n# Real\n") == [
        {"depth": 1, "text": "Real", "slug": "real"}
    ]


def test_reading_time_is_never_below_one_minute() -> None:
    assert extract_outline("hi")["readingTimeMinutes"] == 1


def test_reading_time_rounds_from_the_word_count() -> None:
    outline = extract_outline(" ".join(["word"] * 1000))
    assert outline["wordCount"] == 1000
    assert outline["readingTimeMinutes"] == 5


# ---------------------------------------------------------------------------
# The shared fixture
# ---------------------------------------------------------------------------


@pytest.mark.skipif(not GALLERY.exists(), reason="gallery post not present")
def test_gallery_post_outline() -> None:
    outline = extract_outline(GALLERY.read_text(encoding="utf-8"))

    assert outline["renderer"] == RENDERER_VERSION
    assert outline["wordCount"] > 0
    assert outline["headings"], "the gallery post has headings"

    # It is the fixture precisely because it uses everything.
    missing = set(COMPONENT_SPELLINGS) - set(outline["components"])
    assert not missing, f"gallery post no longer exercises: {sorted(missing)}"

    # The explicit `{#id}` anchors have to survive into the outline.
    slugs = {heading["slug"] for heading in outline["headings"]}
    assert {"why", "layout", "structure", "data", "media", "tabs"} <= slugs
