---
title: "JSON vs YAML for LLM Output: What the Tokens Actually Cost"
date: 2025-10-15
author: "Tashif Ahmad Khan"
socials:
  [
    "https://www.github.com/tashifkhan",
    "https://www.linkedin.com/in/tashif-ahmad-khan-982304244/",
    "https://tashif.codes",
  ]
tags: ["Mobile Development"]
excerpt: "A pipeline of mine kept asking an LLM for JSON and kept paying for every brace and quote in the reply. I switched the output format to YAML, then got curious and actually ran both through tiktoken to see what was true and what was just a stat floating around the internet. There's a real saving, and a catch nobody mentions: minified JSON beats YAML on raw tokens."
coverImage: "/images/blog/JSON-YAML-LLM/cover.svg"
---

<Lede>
I had a pipeline that asked an LLM to extract structured fields out of messy text, one call per record, a few hundred thousand records a month. Nothing fancy, just a prompt with a schema and "respond in JSON." The bill was fine until volume went up, and when I actually broke down where the tokens were going, a good chunk of every response was <code>{</code>, <code>}</code>, <code>"</code> and <code>,</code> characters that carried zero information. Someone on a team call said "just use YAML, it's like 50% fewer tokens," and I'd seen that exact number floating around blog posts for a year without anyone showing their work. So I opened a terminal, installed tiktoken, and counted.
</Lede>

This post is that count, plus the mechanics of why it comes out the way it does, plus the one thing the "switch to YAML" advice usually leaves out: it's true against pretty-printed JSON, and it quietly stops being true the moment someone minifies.

<Toc depth={2} />

## the whole shape of this, in one table

| | pretty JSON | minified JSON | YAML |
| --- | --- | --- | --- |
| Structural tokens (braces, quotes, commas) | most | fewer, still there | almost none |
| Raw token count, my measured payload | 565 | **317** | 400 |
| Human-readable in logs / a debugger | yes | no | yes |
| Model generation reliability | worst | worst | best |
| Native `JSON.parse()` in JS | yes | yes | needs a library |
| Schema validation ecosystem | mature (JSON Schema) | mature | convert first |
| Best fit | prompts, examples | never generate this directly | LLM output |

That middle column is the twist. Every "YAML saves tokens" post I'd read compared YAML against pretty-printed JSON, because pretty JSON is what people paste into examples. Nobody generates minified JSON by hand, so nobody was comparing against it. But an LLM doesn't care about indentation being annoying to type, and once you strip the whitespace, JSON gets a lot closer to YAML than the popular numbers suggest. More on that below, with actual counts.

## how a tokenizer actually counts your braces

Modern LLMs tokenize with byte pair encoding, originally a 1994 data-compression trick, repurposed as the standard for GPT-3.5 through GPT-5, Claude, and Llama. The process is roughly:

1. Text becomes UTF-8 bytes.
2. It gets pre-split on whitespace and punctuation boundaries into "pretokens."
3. The most frequent byte pairs get merged into bigger tokens, built up from a training pass over huge amounts of text.
4. Each merged unit gets an integer ID, which is what the model actually reads.

GPT-2 used a 50,257-token vocabulary. GPT-4's `cl100k_base` doubled that. GPT-4o's `o200k_base` is roughly 200k. None of that matters for this post except for one consequence: every character is a candidate for its own token, so punctuation you'd never notice while reading is something you're paying for on every single call.

## the punctuation tax, side by side

Same data, two formats:

```json
{
  "user": {
    "name": "John Doe",
    "active": true,
    "roles": ["admin", "developer"]
  }
}
```

```yaml
user:
  name: John Doe
  active: true
  roles:
    - admin
    - developer
```

JSON pays for every brace, every bracket, every quote around a key or string, every comma. YAML drops nearly all of it, using indentation, which is whitespace the tokenizer would be counting anyway. The comparison holds for multiline strings too: JSON needs `\n` escape sequences (two tokens each: backslash and n), while YAML's block scalar (`|`) just uses real newlines.

None of that is new information. What I wanted to know was the actual number for a payload shaped like the ones I was sending, not a toy `{name, active, roles}` example.

## I actually ran the tokens myself

I built a payload that looks like what my pipeline was actually extracting: a list of 10 records with an id, a name, a category, a price, a stock flag and a tags array. Then I ran it through `tiktoken` three ways: pretty JSON, minified JSON, and YAML.

```python
import tiktoken, json, yaml

payload = {"items": [
    {"id": i, "name": f"Item {i}", "category": "electronics" if i % 2 == 0 else "books",
     "price": round(19.99 + i * 3.5, 2), "in_stock": (i % 3 != 0),
     "tags": ["sale", "new"] if i % 4 == 0 else ["clearance"]}
    for i in range(1, 11)
]}

json_pretty = json.dumps(payload, indent=2)
json_min = json.dumps(payload, separators=(",", ":"))
yaml_str = yaml.dump(payload, sort_keys=False, default_flow_style=False)

enc = tiktoken.get_encoding("o200k_base")  # GPT-4o's encoding
for label, text in [("pretty json", json_pretty), ("minified json", json_min), ("yaml", yaml_str)]:
    print(label, len(enc.encode(text)))
```

The output:

<Kpi cols={3}>
<Stat value="565" label="pretty JSON tokens" tone="danger" />
<Stat value="400" label="YAML tokens" tone="ok" />
<Stat value="317" label="minified JSON tokens" tone="accent" />
</Kpi>

YAML beats pretty JSON by 29%, which is in the ballpark of the numbers people quote, and lines up with what I expected. But minified JSON came in at 317 tokens, a full 21% *below* YAML. That's the part nobody's blog post mentions, because nobody's comparing against it. If your actual deployed format is minified JSON, not the pretty-printed kind in your prompt examples, "switch to YAML" is not a free win. It might be a step backward.

<Warning title="These numbers are one payload, on one tokenizer">
I ran this on a 10-item list with a fairly typical record shape, using `o200k_base`. Deeper nesting, longer strings, and repeated keys all shift the ratio. Run your own payload through `tiktoken` before you trust any percentage in this post, mine included.
</Warning>

## so why doesn't everyone just minify?

Because generating minified JSON reliably is a different problem than counting its tokens. A pretty-printed JSON object with a stray comment or a trailing comma still mostly makes sense to a human debugging it. A minified blob with one wrong character anywhere just fails to parse, full stop, and now you're retrying the whole call. In my own experience, the deeper the nesting and the longer the array, the more often a JSON completion loses a closing brace or forgets to escape a quote inside a string value, and YAML is just more forgiving here: a bad indent under a key that has no children often still parses into something sane, because there are fewer ways to be syntactically wrong in the first place.

There's a real caveat to that, though: if you're using OpenAI's Structured Outputs or Anthropic's tool-use / forced JSON mode, the provider is running constrained decoding under the hood, the model literally cannot emit invalid JSON against your schema. That closes most of the reliability gap for those specific APIs. You still pay the token tax for the braces and quotes (constrained decoding doesn't make the tokens free), you just don't pay the retry tax. If you're on a plain chat completion asking nicely for JSON in the prompt with no schema enforcement, the reliability gap is real and it's the reason I kept YAML even after minified JSON won on raw tokens.

## the cost math

Cost scales linearly with tokens: `cost = (tokens / 1e6) × price_per_million`. Scaling my measured 10-item payload (565 pretty / 400 YAML / 317 minified tokens) to 1M calls a month, treating input and output as roughly symmetric for a round number, current-ish per-token pricing gives:

| Model | Pretty JSON /mo | YAML /mo | Minified JSON /mo | YAML savings vs pretty (yr) |
| --- | --- | --- | --- | --- |
| GPT-5 | $6,356 | $4,500 | $3,566 | **$22,275** |
| Claude Sonnet 4.5 | $10,170 | $7,200 | $5,706 | **$35,640** |
| Claude Opus 4.1 | $50,850 | $36,000 | $28,530 | **$178,200** |
| Gemini 2.5 Pro | $6,356 | $4,500 | $3,566 | **$22,275** |

<Danger title="Pricing drifts, check before you quote this">
These are per-token prices at the time I wrote this, and providers change them without much warning. Treat the dollar figures as "here's the shape of the effect," not a number to put in a slide deck. Re-run the math with whatever's current before it goes near a budget conversation.
</Danger>

The honest takeaway from that table isn't "YAML saves you six figures." It's that the delta between YAML and minified JSON is smaller than the delta between YAML and what most people are actually shipping, which is pretty-printed JSON because that's what the docs example looked like.

## when JSON still wins

I didn't rip JSON out everywhere, and you shouldn't either:

- **Downstream schema validation.** JSON Schema and its tooling are more mature than the YAML equivalents. My pattern: generate YAML from the model, parse it, validate with Pydantic, then serialize to JSON if something downstream needs it.
- **Raw parsing speed.** `JSON.parse()` beats a YAML parser on typical payloads. If you're doing tens of thousands of parses a second in a hot path, that gap is worth knowing about, even if it never mattered for my few-hundred-thousand-a-month pipeline.
- **The JS ecosystem.** `JSON.parse()` and `JSON.stringify()` are built in. YAML always means an extra dependency, however small.

## the decision guide

<Checklist title="picking a format for LLM structured output">
- [ ] Are you actually generating pretty-printed JSON today? That's the case YAML clearly beats.
- [ ] Are you minifying JSON server-side already? Then the token argument for YAML gets weak, check your own numbers.
- [ ] Are you on a schema-enforced API (Structured Outputs, tool use)? Reliability gap mostly closes, token gap doesn't.
- [ ] Downstream needs strict JSON Schema validation? Generate YAML, parse, validate, convert.
- [ ] High-throughput hot path parsing tokens per second? JSON's native parser still wins there.
- [ ] Ran your own payload through tiktoken yet? Do that before trusting any percentage, including mine.
</Checklist>

**Bottom line:** switching from pretty-printed JSON to YAML for LLM output is a real, measurable token saving, somewhere in the 20-50% range depending on payload shape, and it comes with a genuine reliability upside for unconstrained generation. What it isn't is a universal law: minified JSON can beat YAML on raw tokens alone, and schema-enforced APIs shrink the reliability gap that used to be YAML's other selling point. Measure your own payload before you repeat anyone's percentage, mine included.

<Hand>
if you take one thing from this: open a terminal, `pip install tiktoken`, and count your own payload before you change anything.
</Hand>
