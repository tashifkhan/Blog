---
title: "A College Forked My Open Source Project — and Forgot to Change the Analytics Key"
date: 2026-08-15
author: "Tashif Ahmad Khan"
socials:
  [
    "https://www.github.com/tashifkhan",
    "https://www.linkedin.com/in/tashif-ahmad-khan-982304244/",
    "https://tashif.codes",
  ]
tags: ["Open Source", "Licensing", "Story"]
excerpt: "Ramachandra College of Engineering rebuilt my MIT-licensed CodeTrace into a placement portal — and shipped it with my PostHog key still inside. Here's the whole story, the evidence, and what the MIT license actually asked of them."
coverImage: "/images/blog/Ramachandra-College-CodeTrace-Copy/cover.svg"
---

<Lede>
I built [CodeTrace](https://codetrace.xyz) — a dashboard that aggregates your coding footprint across GitHub, LeetCode, Codeforces, GeeksForGeeks, CodeChef, HackerRank and takeUforward. It's MIT licensed, source is on GitHub. A few weeks ago I found Ramachandra College of Engineering running a rebuilt version of it at `sptracker1.vercel.app`, rebranded into a placement portal for their Training & Placement Cell. No attribution anywhere. And — here's the part that still makes me laugh — they left my PostHog analytics key in the production bundle, so their entire student body has been logging pageviews into my dashboard this whole time.
</Lede>

This is the story of how I found it, the evidence I pulled, what the MIT license actually required of them (spoiler: very little), and the one line of HTML that gave the whole thing away.

<Toc />

## the moment I found it

First, here's what I built — so you can see the DNA I'm talking about for the rest of this post. This is CodeTrace, the dashboard, the exact terminal-styled landing page with the search prompt and the platform grid:

![CodeTrace — the original dashboard I built, terminal-styled landing page|720](https://blog.tashif.codes/images/blog/Ramachandra-College-CodeTrace-Copy/codetrace-features.png)

Now the story. I was doing my usual sweep of the analytics dashboard — checking which routes were getting traffic, which integrations were burning — when I noticed a pattern of sessions that didn't look like mine. The referrers were coming from `sptracker1.vercel.app`. I didn't own that domain. So I clicked it.

The first thing I saw stopped me cold. A dark, terminal-styled landing page — my design language, my layout. Here's the exact screenshot I took the moment I landed on it:

![The copied site as I first found it — the same dark terminal aesthetic, search prompt and platform grid as CodeTrace|720](https://blog.tashif.codes/images/blog/Ramachandra-College-CodeTrace-Copy/sptracker-copy.png)

"Student Performance — Placement & Coding Analytics." The "start by searching a username" prompt, the seven platform icons — all straight from CodeTrace. It looked… legitimate. Polished, even. For a beat I genuinely thought some student had built their own placement tracker and the referrers were a coincidence.

Then, a few weeks later, it changed. Same DNA, new skin:

![The copy after they rebuilt it — login-gated, with a Training and Placement Cell header|720](https://blog.tashif.codes/images/blog/Ramachandra-College-CodeTrace-Copy/sptracker-now.png)

A Training and Placement Cell header now. An RCEE logo up top. A login wall in front of the real app, a leaderboard behind it. They'd put real work into making it *theirs*. The terminal was gone — but then I hit View Source.

## the first giveaway: the head tag

Open any modern React app and you'll see a wall of meta tags. Colleges don't write meta tags — they leave the ones from the template in place. Look at what was still sitting in this production site's `<head>`:

```html
<meta property="og:image" content="https://codetrace.xyz/og-image.png" />
<meta property="og:url" content="https://codetrace.xyz" />
<link rel="canonical" href="https://codetrace.xyz" />
```

There it is. The Open Graph image — the preview thumbnail that renders when you paste a link into WhatsApp or LinkedIn — is being pulled from **my** domain. The canonical URL, the thing that tells Google "this is the real, authoritative page," points at **my** site.

<Note title="How I know these weren't updated">
These are the exact lines from the built bundle's head. Nobody regenerates a canonical tag by hand and leaves it pointing at someone else's domain by accident. It's the original template, shipped as-is.
</Note>

So whatever they built on top, the skeleton came from somewhere, and that somewhere had my URL stamped into its metadata. I wanted to confirm where the skeleton came from before I said anything. I was about ninety percent sure already, but the last ten percent needed proof.

## the second giveaway: the analytics key

PostHog is the product-analytics tool I use. Every CodeTrace pageview, every click, every navigation gets reported to my project — with a project key that lives in the client bundle. It's not a secret; client-side keys can't be. The point is that key belongs to my PostHog project.

Here's the key that shipped in CodeTrace's bundle:

```text
phc_xxpoU7jHjt4nKAb4ygdiNwheukaBi7QvoAT4AsrdBcZC
```

And here's the key sitting in `sptracker1.vercel.app`'s bundle:

```text
phc_xxpoU7jHjt4nKAb4ygdiNwheukaBi7QvoAT4AsrdBcZC
```

Identical. Character for character.

That's not a coincidence you stumble into. It means the analytics wiring in their production site still calls home to my PostHog project. Every student, every staff member, every TPO officer who visits that placement portal is being tracked in my dashboard. I can see their traffic. I can see their routes. I never asked for any of that, and they never knew it was happening.

Here's the PostHog dashboard, live, as I write this — their visitors' sessions mixed in with mine:

![PostHog analytics showing the leaked traffic — student sessions from sptracker1.vercel.app reporting into my project|720](https://blog.tashif.codes/images/blog/Ramachandra-College-CodeTrace-Copy/posthog-analytics.png)

That's not a hypothetical. That's their users' pageviews, flowing into my analytics project, in real time, since the day they deployed. Every one of those sessions is a student or staff member who never consented to being tracked by a stranger's dashboard.

<Important title="Why this is the worst leak of all">
The missing attribution is a licensing problem. The leaked analytics key is a *privacy* problem — for their users. I'm a stranger to their platform, and their visitors' behavior has been flowing to my analytics project since they deployed.
</Important>

## the MIT license asked for one thing

Here's the part that makes this whole thing avoidable. MIT is about as permissive as licenses get. It says you can do basically anything — copy it, remix it, sell it, whatever. The one condition, and I'll quote it because it's short:

> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

That's it. One sentence. Somewhere on the site, in a footer or a README or an about page, credit the original. That's the whole deal.

The copied site's footer says "© 2026 Student Performance." No link to CodeTrace, no credit, nothing. The one condition — the entire price of MIT — went unpaid.

## the thing they actually did well

I want to be fair here, because "it's a copy" undersells what they built. I poked around the current site and it's genuinely evolved:

- A **login-gated app** behind the landing page — placement office staff sign in to see student dossiers
- A **leaderboard** ranking students by a weighted "Fame XP" — coding 20%, readiness 12%, communication 12%, aptitude 10%, verbal 10%…
- **Pass-out year cohorts** (2027–2030) with per-student readiness and comm scores
- The seven coding-platform integrations still humming underneath

This isn't a skin swap. Someone put real work into building a placement product. That's the frustrating part — the work is good. They just skipped the one line of credit, and the one key swap, that would have made it entirely legitimate.

Here's the original CodeTrace repo and its feature set, for comparison:

![CodeTrace GitHub repository|720](https://blog.tashif.codes/images/blog/Ramachandra-College-CodeTrace-Copy/github-repo.png)

And the original CodeTrace site, as it stands today:

![CodeTrace today — the original dashboard|720](https://blog.tashif.codes/images/blog/Ramachandra-College-CodeTrace-Copy/codetrace-now.png)

Same platform integrations. Same "all stats compiled dynamically" footer phrasing. Same DNA — rebranded, extended, and pointed at a different audience.

## what the right fork looks like

If you're a student or staff member at RCEE reading this, and you want to keep this project — genuinely, please do. MIT gives you the right. Here's the checklist that makes it clean:

<Checklist title="The four-line fix">
- [ ] Add a footer line: "Based on CodeTrace by Tashif Khan — github.com/tashifkhan/CodeTrace (MIT)"
- [ ] Delete my PostHog key, create your own project, wire in your own key
- [ ] Point og:image, og:url, and canonical at your own domain
- [ ] Keep the LICENSE file in your repo so the lineage stays honest
</Checklist>

That's an afternoon of work, and it turns this story from "a college ripped off my project" into "a college built something nice on top of my project," which is the outcome I actually want. Open source is supposed to be a force multiplier. The whole point of MIT is that this reuse is *allowed* — it just has to be honest.

<InkBand title="bottom line">
They took my MIT-licensed project, built a real placement portal on top of it, forgot to change the analytics key, forgot the attribution, and left my domain in their canonical tags. Every one of those is a one-line fix. None of them were done. The license was never the barrier — awareness was.
</InkBand>

## what happens now

Honestly? Nothing dramatic on my end. I'm not looking for a takedown. I wrote this post because the exact failure mode — free code, one tiny obligation, skipped — is worth telling people about, and because whoever inherits that project deserves to know their visitors' data has been leaking to a stranger's analytics dashboard.

If you fork open source code, here's the three things I actually care about, in order:

1. **Change the secrets** — keys, tokens, endpoints. Always. For your users' sake as much as the original author's.
2. **Keep the credit** — it's one line and it's the entire cost of the license.
3. **Make it yours** — the code is a starting point, not the finish line. RCEE's Fame XP leaderboard is more interesting than the thing I shipped. That's the spirit.

CodeTrace will stay open. MIT will keep being MIT. I just hope the next fork checks the head tag before it deploys.

<Hand>
if you're the RCEE team — this isn't a call-out, it's a handshake. shoot me a message if you want help fixing the key or the footer. the placement portal is a good idea. make it yours, properly.
</Hand>
