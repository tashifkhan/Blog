/**
 * Generates neo-brutalist poster SVG covers for every post in src/blogs/.
 *
 * Visual language mirrors sleeck.dev project covers:
 * - Solid lavender field + halftone dots (no soft blooms / glass / vignettes)
 * - Lime + white + black only (with a few solid accent chips)
 * - Thick black outlines, hard offset shadows, bold display type
 * - One graphic concept per post — poster art, not UI mockups
 *
 *   bun scripts/generate-covers.mjs
 */

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BLOGS_DIR = join(ROOT, "src/blogs");
const OUT_DIR = join(ROOT, "public/images/blog");

const W = 1200;
const H = 630;

// ---------------------------------------------------------------------------
// Sleeck-aligned palette (flat, high contrast, zero soft glows)
// ---------------------------------------------------------------------------
const C = {
	bg: "#C4B5F0",
	bgDeep: "#A894E0",
	lime: "#A8E63A",
	limeDark: "#7BC41F",
	white: "#FFFFFF",
	ink: "#0F0C1A",
	black: "#000000",
	mint: "#9BE7A3",
	butter: "#F0E15C",
	coral: "#FF8F7A",
	sky: "#7EC8FF",
	lilac: "#E0D6FF",
};

/**
 * Per-post metadata. short = display title stamped on the poster (like SYNTH).
 * chip = category badge fill (solid, never translucent).
 */
const TOPICS = {
	"Android-Service": {
		short: "ANDROID",
		sub: "SERVICES & WORKMANAGER",
		category: "Mobile",
		chip: C.mint,
		year: "2025",
	},
	"CORS-Explained": {
		short: "CORS",
		sub: "CROSS-ORIGIN SHARING",
		category: "Security",
		chip: C.coral,
		year: "2025",
	},
	GitUnderTheHood: {
		short: "GIT",
		sub: "OBJECTS · DAG · REFS",
		category: "Systems",
		chip: C.butter,
		year: "2025",
	},
	HTMLRendering: {
		short: "RENDER",
		sub: "DOM → PIXELS",
		category: "Browser",
		chip: C.sky,
		year: "2025",
	},
	"JSON-YAML-LLM": {
		short: "YAML",
		sub: "TOKEN-LEAN PROMPTS",
		category: "AI / LLM",
		chip: C.lilac,
		year: "2025",
	},
	"Prisma-Notes": {
		short: "PRISMA",
		sub: "ORM · SCHEMA · CLIENT",
		category: "Database",
		chip: C.mint,
		year: "2025",
	},
	"Python-Call-By-Reference": {
		short: "REFS",
		sub: "STACK · HEAP · IDS",
		category: "Python",
		chip: C.sky,
		year: "2025",
	},
	"Python-Class-Creation": {
		short: "type()",
		sub: "METACLASS FACTORY",
		category: "Python",
		chip: C.butter,
		year: "2025",
	},
	"Python-Imports-Guide": {
		short: "IMPORT",
		sub: "sys.path · MODULES",
		category: "Python",
		chip: C.mint,
		year: "2025",
	},
	"Python-Linked-List-Dunder-Methods": {
		short: "LIST",
		sub: "DUNDER · NODES · __next__",
		category: "DSA",
		chip: C.coral,
		year: "2025",
	},
	"Python-Nested-Loops": {
		short: "N×M",
		sub: "NESTED ITERATION",
		category: "Algorithms",
		chip: C.butter,
		year: "2025",
	},
	"React-Native-Architecture": {
		short: "JSI",
		sub: "BRIDGE → NEW ARCH",
		category: "Mobile",
		chip: C.sky,
		year: "2025",
	},
	"React-useRef-vs-useState": {
		short: "REF",
		sub: "vs STATE · RENDERS",
		category: "React",
		chip: C.coral,
		year: "2025",
	},
	RenderingSSR: {
		short: "SSR",
		sub: "SSG · ISR · CSR",
		category: "Web",
		chip: C.butter,
		year: "2025",
	},
	"Web-Vitals-Guide": {
		short: "VITALS",
		sub: "LCP · INP · CLS",
		category: "Perf",
		chip: C.mint,
		year: "2025",
	},
	"component-gallery": {
		short: "UI",
		sub: "COMPONENT GALLERY",
		category: "Design",
		chip: C.lilac,
		year: "2025",
	},
};

const DEFAULT_TOPIC = {
	short: "POST",
	sub: "TECHNICAL NOTE",
	category: "Article",
	chip: C.lime,
	year: "2025",
};

// ---------------------------------------------------------------------------
// Primitives — thick ink, hard shadows, flat fills only
// ---------------------------------------------------------------------------

const escapeXml = (str) =>
	String(str ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");

const px = (n) => Math.round(n * 100) / 100;

const box = (x, y, w, h, r = 0, f = "none", s = C.black, sw = 4) =>
	`<rect x="${px(x)}" y="${px(y)}" width="${px(w)}" height="${px(h)}" rx="${r}" fill="${f}" stroke="${s}" stroke-width="${sw}"/>`;

/** Hard offset shadow (brutalist, no blur) */
const shadowBox = (x, y, w, h, r = 0, f = C.white, s = C.black, sw = 4, ox = 6, oy = 6) =>
	box(x + ox, y + oy, w, h, r, C.black, "none", 0) + box(x, y, w, h, r, f, s, sw);

const circle = (cx, cy, r, f = C.white, s = C.black, sw = 4) =>
	`<circle cx="${px(cx)}" cy="${px(cy)}" r="${px(r)}" fill="${f}" stroke="${s}" stroke-width="${sw}"/>`;

const line = (x1, y1, x2, y2, s = C.black, sw = 4, extra = "") =>
	`<line x1="${px(x1)}" y1="${px(y1)}" x2="${px(x2)}" y2="${px(y2)}" stroke="${s}" stroke-width="${sw}" stroke-linecap="round"${extra ? " " + extra : ""}/>`;

const path = (d, f = "none", s = C.black, sw = 4, extra = "") =>
	`<path d="${d}" fill="${f}" stroke="${s}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${extra ? " " + extra : ""}/>`;

const poly = (points, f = C.lime, s = C.black, sw = 4) =>
	`<polygon points="${points}" fill="${f}" stroke="${s}" stroke-width="${sw}" stroke-linejoin="round"/>`;

/** Display title — black fill, white stroke halo (comic poster weight) */
const displayTitle = (text, x, y, size = 96, anchor = "start") =>
	`<text x="${px(x)}" y="${px(y)}" text-anchor="${anchor}"
		fill="${C.black}" stroke="${C.white}" stroke-width="10" paint-order="stroke fill"
		font-family="Impact, Haettenschweiler, 'Arial Black', 'Helvetica Neue', sans-serif"
		font-size="${size}" font-weight="900" letter-spacing="-0.02em">${escapeXml(text)}</text>`;

const mono = (text, x, y, size = 14, fill = C.ink, weight = 700, anchor = "start") =>
	`<text x="${px(x)}" y="${px(y)}" text-anchor="${anchor}" fill="${fill}"
		font-family="ui-monospace, SFMono-Regular, 'Geist Mono', Menlo, monospace"
		font-size="${size}" font-weight="${weight}" letter-spacing="0.04em">${escapeXml(text)}</text>`;

const sans = (text, x, y, size = 16, fill = C.ink, weight = 800, anchor = "start") =>
	`<text x="${px(x)}" y="${px(y)}" text-anchor="${anchor}" fill="${fill}"
		font-family="'DM Sans', 'Helvetica Neue', Arial, sans-serif"
		font-size="${size}" font-weight="${weight}">${escapeXml(text)}</text>`;

/** Solid chip badge (category / year) — hard border, hard shadow */
const chip = (x, y, text, fill = C.lime, textFill = C.black) => {
	const padX = 14;
	const w = Math.max(72, text.length * 8.2 + padX * 2);
	const h = 34;
	let s = box(x + 4, y + 4, w, h, 6, C.black, "none", 0);
	s += box(x, y, w, h, 6, fill, C.black, 3);
	s += mono(text, x + w / 2, y + 22, 13, textFill, 800, "middle");
	return s;
};

/** Fat arrow between two points */
const fatArrow = (x1, y1, x2, y2, s = C.black, sw = 5) => {
	const dx = x2 - x1;
	const dy = y2 - y1;
	const len = Math.hypot(dx, dy) || 1;
	const uX = dx / len;
	const uY = dy / len;
	const head = 16;
	const hX1 = x2 - uX * head + uY * 9;
	const hY1 = y2 - uY * head - uX * 9;
	const hX2 = x2 - uX * head - uY * 9;
	const hY2 = y2 - uY * head + uX * 9;
	return (
		line(x1, y1, x2 - uX * (head - 2), y2 - uY * (head - 2), s, sw) +
		path(`M ${px(hX1)} ${px(hY1)} L ${px(x2)} ${px(y2)} L ${px(hX2)} ${px(hY2)} Z`, s, s, 1)
	);
};

// ---------------------------------------------------------------------------
// Motifs — one bold poster concept each
// ---------------------------------------------------------------------------

const MOTIFS = {
	/** Stacked service layers on a chunky phone silhouette */
	"Android-Service": () => {
		let s = "";
		// Phone body
		s += shadowBox(720, 90, 360, 480, 36, C.white, C.black, 5, 8, 8);
		s += box(750, 120, 300, 40, 10, C.bgDeep, C.black, 3);
		s += circle(900, 140, 8, C.lime, C.black, 3);

		const layers = [
			{ y: 190, label: "FOREGROUND", sub: "WorkManager · Lock", fill: C.lime },
			{ y: 300, label: "BACKGROUND", sub: "OS limits · reclaim", fill: C.white },
			{ y: 410, label: "BOUND / AIDL", sub: "IPC · 3 clients", fill: C.mint },
		];
		layers.forEach((L) => {
			s += shadowBox(760, L.y, 280, 90, 12, L.fill, C.black, 4, 5, 5);
			s += sans(L.label, 780, L.y + 38, 20, C.black, 900);
			s += mono(L.sub, 780, L.y + 64, 13, C.ink, 600);
		});

		// Left: big android-ish robot head mark + title
		s += displayTitle("ANDROID", 60, 200, 88);
		s += mono("SERVICES · LIFECYCLE · IPC", 68, 250, 16, C.ink, 700);
		// Priority badge
		s += shadowBox(60, 300, 280, 120, 12, C.lime, C.black, 4, 6, 6);
		s += sans("PRIORITY", 80, 345, 14, C.black, 700);
		s += displayTitle("100", 80, 410, 64);
		return s;
	},

	/** Two origin blocks + shield gateway */
	"CORS-Explained": () => {
		let s = "";
		s += displayTitle("CORS", 60, 175, 92);

		// Origin A
		s += shadowBox(50, 250, 360, 300, 14, C.white, C.black, 5, 7, 7);
		s += box(50, 250, 360, 52, 14, C.coral, C.black, 5);
		s += box(50, 280, 360, 22, 0, C.coral, "none", 0);
		s += sans("ORIGIN A", 70, 284, 18, C.black, 900);
		s += mono("https://app.io", 70, 340, 18, C.ink, 800);
		s += mono("fetch(POST, custom)", 70, 380, 14, C.ink, 600);
		s += mono("headers: X-Custom", 70, 410, 14, C.ink, 600);
		s += chip(70, 470, "CLIENT", C.butter);

		// Origin B
		s += shadowBox(790, 250, 360, 300, 14, C.white, C.black, 5, 7, 7);
		s += box(790, 250, 360, 52, 14, C.mint, C.black, 5);
		s += box(790, 280, 360, 22, 0, C.mint, "none", 0);
		s += sans("ORIGIN B", 810, 284, 18, C.black, 900);
		s += mono("https://api.com", 810, 340, 18, C.ink, 800);
		s += mono("Allow-Origin: *", 810, 380, 14, C.ink, 600);
		s += mono("Allow-Methods: POST", 810, 410, 14, C.ink, 600);
		s += chip(810, 470, "APPROVED", C.lime);

		// Center shield
		s += path(
			"M 600 300 L 675 345 L 675 430 L 600 485 L 525 430 L 525 345 Z",
			C.lime,
			C.black,
			5,
		);
		s += path("M 570 390 L 595 420 L 640 360", "none", C.black, 6);
		s += fatArrow(420, 350, 515, 350, C.black, 5);
		s += fatArrow(685, 430, 780, 430, C.black, 5);
		s += mono("OPTIONS", 445, 330, 12, C.ink, 800);
		s += mono("ALLOW", 700, 460, 12, C.ink, 800);
		return s;
	},

	/** Fat commit DAG */
	GitUnderTheHood: () => {
		let s = "";
		s += displayTitle("GIT", 60, 200, 110);
		s += mono("OBJECTS · DAG · REFS", 70, 245, 16, C.ink, 700);

		const y = 360;
		const nodes = [
			{ x: 140, sha: "9f8a", head: false },
			{ x: 320, sha: "4b2e", head: false },
			{ x: 500, sha: "d710", head: false },
			{ x: 680, sha: "a38f", head: false },
			{ x: 860, sha: "ef62", head: true },
		];

		// Trunk + branch
		s += line(140, y, 860, y, C.black, 8);
		s += path(`M 320 ${y} L 400 230 L 600 230 L 680 ${y}`, "none", C.black, 7);

		// Branch nodes
		[
			{ x: 430, y: 230, sha: "f501" },
			{ x: 580, y: 230, sha: "782a" },
		].forEach((n) => {
			s += circle(n.x + 5, n.y + 5, 36, C.black, "none", 0);
			s += circle(n.x, n.y, 36, C.butter, C.black, 5);
			s += mono(n.sha, n.x, n.y + 6, 14, C.black, 900, "middle");
		});
		s += chip(500, 140, "feature/auth", C.butter);

		nodes.forEach((n) => {
			const r = n.head ? 48 : 40;
			s += circle(n.x + 6, y + 6, r, C.black, "none", 0);
			s += circle(n.x, y, r, n.head ? C.lime : C.white, C.black, 5);
			s += mono(n.sha, n.x, y + 6, 15, C.black, 900, "middle");
		});
		s += chip(920, 300, "HEAD → main", C.lime);

		// Object cards
		s += shadowBox(430, 470, 150, 56, 10, C.white, C.black, 4, 4, 4);
		s += mono("TREE 4b1c", 505, 505, 14, C.ink, 800, "middle");
		s += shadowBox(620, 470, 150, 56, 10, C.sky, C.black, 4, 4, 4);
		s += mono("BLOB 8e3a", 695, 505, 14, C.ink, 800, "middle");
		s += line(500, y + 40, 505, 470, C.black, 3);
		s += line(500, y + 40, 695, 470, C.black, 3);
		return s;
	},

	/** DOM tree → composited layers */
	HTMLRendering: () => {
		let s = "";
		s += displayTitle("RENDER", 50, 195, 88);
		s += mono("HTML → DOM → LAYOUT → PAINT → COMPOSITE", 58, 235, 14, C.ink, 700);

		// DOM tree panel
		s += shadowBox(50, 265, 420, 300, 14, C.white, C.black, 5, 7, 7);
		s += box(50, 265, 420, 48, 14, C.sky, C.black, 5);
		s += box(50, 291, 420, 22, 0, C.sky, "none", 0);
		s += sans("1. DOM TREE", 70, 296, 18, C.black, 900);

		const cx = 260;
		s += circle(cx, 350, 26, C.lime, C.black, 4);
		s += mono("html", cx, 355, 12, C.black, 900, "middle");
		s += line(cx, 376, cx - 80, 420, C.black, 4);
		s += line(cx, 376, cx + 80, 420, C.black, 4);
		s += circle(cx - 80, 440, 22, C.white, C.black, 4);
		s += mono("body", cx - 80, 445, 11, C.black, 800, "middle");
		s += circle(cx + 80, 440, 22, C.white, C.black, 4);
		s += mono("head", cx + 80, 445, 11, C.black, 800, "middle");
		s += line(cx - 80, 462, cx - 120, 510, C.black, 3);
		s += line(cx - 80, 462, cx - 40, 510, C.black, 3);
		s += circle(cx - 120, 520, 14, C.mint, C.black, 3);
		s += circle(cx - 40, 520, 14, C.mint, C.black, 3);

		s += fatArrow(490, 410, 560, 410, C.black, 6);

		// GPU layers (isometric stack)
		s += shadowBox(580, 265, 560, 300, 14, C.bgDeep, C.black, 5, 7, 7);
		s += box(580, 265, 560, 48, 14, C.lime, C.black, 5);
		s += box(580, 291, 560, 22, 0, C.lime, "none", 0);
		s += sans("2. COMPOSITED LAYERS", 600, 296, 18, C.black, 900);

		const layers = [
			{ ox: 640, oy: 500, fill: C.white, label: "Background" },
			{ ox: 680, oy: 440, fill: C.mint, label: "Layout" },
			{ ox: 720, oy: 380, fill: C.lime, label: "GPU Transform" },
		];
		layers.forEach((L) => {
			s += path(
				`M ${L.ox} ${L.oy} L ${L.ox + 280} ${L.oy - 50} L ${L.ox + 360} ${L.oy - 20} L ${L.ox + 80} ${L.oy + 30} Z`,
				L.fill,
				C.black,
				4,
			);
			s += mono(L.label, L.ox + 100, L.oy - 5, 13, C.black, 800);
		});
		return s;
	},

	/** JSON vs YAML split poster with token savings */
	"JSON-YAML-LLM": () => {
		let s = "";
		s += displayTitle("YAML", 50, 195, 96);
		s += mono("OVER JSON · TOKEN DENSITY", 58, 240, 16, C.ink, 700);

		// JSON card (heavy)
		s += shadowBox(50, 270, 480, 290, 14, C.white, C.black, 5, 7, 7);
		s += box(50, 270, 480, 48, 14, C.coral, C.black, 5);
		s += box(50, 296, 480, 22, 0, C.coral, "none", 0);
		s += sans("JSON · HEAVY", 70, 302, 18, C.black, 900);
		const jsonLines = [
			'{',
			'  "system": "assistant",',
			'  "temperature": 0.7,',
			'  "messages": [',
			'    {"role":"user","content":"hi"}',
			'  ]',
			'}',
		];
		jsonLines.forEach((t, i) => {
			s += mono(t, 80, 345 + i * 26, 14, C.ink, 600);
		});
		s += chip(70, 515, "142 TOKENS", C.coral, C.black);

		// YAML card (lean)
		s += shadowBox(670, 270, 480, 290, 14, C.white, C.black, 5, 7, 7);
		s += box(670, 270, 480, 48, 14, C.lime, C.black, 5);
		s += box(670, 296, 480, 22, 0, C.lime, "none", 0);
		s += sans("YAML · LEAN", 690, 302, 18, C.black, 900);
		const yamlLines = [
			"system: assistant",
			"temperature: 0.7",
			"messages:",
			"  - role: user",
			"    content: hi",
		];
		yamlLines.forEach((t, i) => {
			s += mono(t, 700, 350 + i * 30, 15, C.ink, 600);
		});
		s += chip(690, 515, "−35% TOKENS", C.lime);

		// VS stamp
		s += circle(600, 410, 42, C.butter, C.black, 5);
		s += sans("VS", 600, 418, 22, C.black, 900, "middle");
		return s;
	},

	/** ERD + Prisma triangle */
	"Prisma-Notes": () => {
		let s = "";
		s += displayTitle("PRISMA", 50, 195, 88);
		s += mono("SCHEMA · CLIENT · MIGRATIONS", 58, 235, 15, C.ink, 700);

		// User model
		s += shadowBox(50, 270, 360, 290, 12, C.white, C.black, 5, 7, 7);
		s += box(50, 270, 360, 50, 12, C.mint, C.black, 5);
		s += box(50, 298, 360, 22, 0, C.mint, "none", 0);
		s += sans("model User", 70, 302, 20, C.black, 900);
		[
			["id", "String  @id"],
			["email", "String  @unique"],
			["name", "String?"],
			["posts", "Post[]"],
		].forEach(([k, v], i) => {
			s += mono(`${k.padEnd(8)} ${v}`, 80, 360 + i * 38, 15, C.ink, 700);
		});

		// Post model
		s += shadowBox(790, 270, 360, 290, 12, C.white, C.black, 5, 7, 7);
		s += box(790, 270, 360, 50, 12, C.sky, C.black, 5);
		s += box(790, 298, 360, 22, 0, C.sky, "none", 0);
		s += sans("model Post", 810, 302, 20, C.black, 900);
		[
			["id", "String  @id"],
			["title", "String"],
			["author", "User @relation"],
			["authorId", "String"],
		].forEach(([k, v], i) => {
			s += mono(`${k.padEnd(10)} ${v}`, 820, 360 + i * 38, 15, C.ink, 700);
		});

		// Prisma mark + connector
		s += line(420, 410, 530, 410, C.black, 6);
		s += line(670, 410, 780, 410, C.black, 6);
		s += path("M 600 350 L 660 460 L 540 460 Z", C.lime, C.black, 5);
		s += chip(530, 490, "1.2ms QUERY", C.butter);
		return s;
	},

	/** Stack namespace → heap objects */
	"Python-Call-By-Reference": () => {
		let s = "";
		s += displayTitle("REFS", 50, 195, 96);
		s += mono("STACK POINTERS · HEAP OBJECTS", 58, 235, 15, C.ink, 700);

		s += shadowBox(50, 270, 380, 290, 14, C.white, C.black, 5, 7, 7);
		s += box(50, 270, 380, 48, 14, C.sky, C.black, 5);
		s += box(50, 296, 380, 22, 0, C.sky, "none", 0);
		s += sans("STACK", 70, 300, 18, C.black, 900);

		[
			{ y: 340, t: "a = [1, 2, 3]", fill: C.lime },
			{ y: 415, t: "b = a", fill: C.lime },
			{ y: 490, t: "c = [1, 2, 3]", fill: C.white },
		].forEach((row) => {
			s += shadowBox(80, row.y, 320, 56, 10, row.fill, C.black, 4, 4, 4);
			s += mono(row.t, 100, row.y + 36, 18, C.black, 800);
		});

		s += fatArrow(450, 365, 560, 350, C.black, 5);
		s += fatArrow(450, 440, 560, 380, C.black, 5);
		s += fatArrow(450, 515, 560, 500, C.black, 5);

		s += shadowBox(580, 270, 560, 290, 14, C.white, C.black, 5, 7, 7);
		s += box(580, 270, 560, 48, 14, C.butter, C.black, 5);
		s += box(580, 296, 560, 22, 0, C.butter, "none", 0);
		s += sans("HEAP", 600, 300, 18, C.black, 900);

		s += shadowBox(610, 340, 500, 110, 12, C.lime, C.black, 4, 5, 5);
		s += mono("id: 0x7F8B2C", 630, 375, 15, C.black, 800);
		s += sans("list  [1, 2, 3]", 630, 410, 20, C.black, 900);
		s += mono("refcount: 2  ·  SHARED", 630, 435, 13, C.ink, 700);

		s += shadowBox(610, 470, 500, 70, 12, C.white, C.black, 4, 5, 5);
		s += mono("id: 0x9E410A  ·  distinct object", 630, 515, 15, C.ink, 700);
		return s;
	},

	/** Metaclass → class → instance assembly line */
	"Python-Class-Creation": () => {
		let s = "";
		s += displayTitle("type()", 50, 195, 92);
		s += mono("METACLASS · CLASS · INSTANCE", 58, 235, 15, C.ink, 700);

		const tiers = [
			{ x: 50, y: 280, fill: C.butter, title: "1. METACLASS", sub: "class Meta(type):", tag: "type" },
			{ x: 420, y: 340, fill: C.lime, title: "2. CLASS", sub: "__new__ → __init__", tag: "User" },
			{ x: 790, y: 400, fill: C.mint, title: "3. INSTANCE", sub: "user_1 = User(...)", tag: "obj" },
		];
		tiers.forEach((t, i) => {
			s += shadowBox(t.x, t.y, 320, 130, 14, t.fill, C.black, 5, 7, 7);
			s += sans(t.title, t.x + 24, t.y + 42, 20, C.black, 900);
			s += mono(t.sub, t.x + 24, t.y + 74, 15, C.ink, 700);
			s += chip(t.x + 24, t.y + 90, t.tag, C.white);
			if (i < 2) {
				const nx = tiers[i + 1].x;
				const ny = tiers[i + 1].y + 65;
				s += fatArrow(t.x + 320, t.y + 65, nx - 10, ny, C.black, 6);
			}
		});
		return s;
	},

	/** sys.path pipeline with MATCH stamp */
	"Python-Imports-Guide": () => {
		let s = "";
		s += displayTitle("IMPORT", 50, 195, 88);
		s += mono("sys.path RESOLUTION · sys.modules CACHE", 58, 235, 15, C.ink, 700);

		const steps = [
			{ t: "1. Current Directory  ./", hit: false },
			{ t: "2. PYTHONPATH Entries", hit: false },
			{ t: "3. site-packages/  ← HIT", hit: true },
			{ t: "4. Standard Library /lib", hit: false },
		];
		steps.forEach((st, i) => {
			const y = 270 + i * 70;
			s += shadowBox(50, y, 620, 60, 12, st.hit ? C.lime : C.white, C.black, 5, 5, 5);
			s += mono(st.t, 80, y + 38, 18, C.black, st.hit ? 900 : 700);
			if (st.hit) s += chip(520, y + 12, "MATCH", C.butter);
		});

		s += fatArrow(700, 420, 780, 420, C.black, 6);

		s += shadowBox(800, 300, 350, 250, 14, C.white, C.black, 5, 7, 7);
		s += box(800, 300, 350, 48, 14, C.mint, C.black, 5);
		s += box(800, 326, 350, 22, 0, C.mint, "none", 0);
		s += sans("sys.modules", 820, 330, 18, C.black, 900);
		s += mono("['mypackage']", 820, 380, 16, C.ink, 800);
		s += mono("• Cached object", 820, 420, 14, C.ink, 600);
		s += mono("• O(1) lookup", 820, 455, 14, C.ink, 600);
		s += chip(820, 490, "RESOLVED", C.lime);
		return s;
	},

	/** Chunky linked list nodes */
	"Python-Linked-List-Dunder-Methods": () => {
		let s = "";
		s += displayTitle("LIST", 50, 195, 100);
		s += mono("__len__ · __getitem__ · __next__", 58, 240, 16, C.ink, 700);

		const nodes = [
			{ x: 80, v: "10", i: "[0]" },
			{ x: 380, v: "20", i: "[1]" },
			{ x: 680, v: "30", i: "[2]" },
		];
		const y = 340;
		nodes.forEach((n, idx) => {
			s += shadowBox(n.x, y - 70, 200, 140, 14, C.lime, C.black, 5, 7, 7);
			s += line(n.x + 130, y - 70, n.x + 130, y + 70, C.black, 4);
			s += sans(n.v, n.x + 65, y + 15, 48, C.black, 900, "middle");
			s += mono(n.i, n.x + 65, y - 90, 16, C.ink, 800, "middle");
			s += circle(n.x + 165, y, 12, C.white, C.black, 4);
			if (idx < nodes.length - 1) {
				s += fatArrow(n.x + 185, y, n.x + 300 - 10, y, C.black, 6);
			} else {
				s += fatArrow(n.x + 185, y, n.x + 280, y, C.black, 6);
				s += shadowBox(n.x + 290, y - 40, 120, 80, 12, C.white, C.black, 4, 5, 5);
				s += mono("None", n.x + 350, y + 10, 18, C.ink, 800, "middle");
			}
		});

		s += line(80, 500, 820, 500, C.black, 5);
		s += line(80, 490, 80, 510, C.black, 5);
		s += line(820, 490, 820, 510, C.black, 5);
		s += chip(380, 520, "__len__() == 3", C.butter);
		return s;
	},

	/** Nested loop matrix with row-major serpentine path */
	"Python-Nested-Loops": () => {
		let s = "";
		s += displayTitle("N×M", 50, 200, 96);
		s += mono("OUTER × INNER · ARBITRARY DEPTH", 58, 245, 15, C.ink, 700);

		// Outer frame
		s += shadowBox(80, 250, 1040, 310, 16, C.white, C.black, 6, 8, 8);
		s += box(80, 250, 1040, 48, 16, C.coral, C.black, 6);
		s += box(80, 278, 1040, 20, 0, C.coral, "none", 0);
		s += mono("for i in range(rows):", 110, 282, 18, C.black, 800);

		// Inner frame
		s += box(140, 320, 920, 210, 12, C.bg, C.black, 5);
		s += mono("for j in range(cols):", 170, 355, 16, C.ink, 800);

		const cols = 7;
		const rows = 3;
		const pts = [];
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				pts.push([240 + c * 110, 400 + r * 48]);
			}
		}
		// Row-major serpentine: L→R, drop, R→L, drop, L→R
		let d = "";
		for (let r = 0; r < rows; r++) {
			const row = pts.slice(r * cols, r * cols + cols);
			const ordered = r % 2 === 0 ? row : [...row].reverse();
			for (const [x, y] of ordered) {
				d += d ? ` L ${x} ${y}` : `M ${x} ${y}`;
			}
		}
		s += path(d, "none", C.black, 4, 'stroke-dasharray="8 8"');
		// Nodes drawn AFTER path so fills sit cleanly on top
		pts.forEach(([cx, cy], idx) => {
			const isStart = idx === 0;
			const isEnd = idx === pts.length - 1;
			s += circle(cx, cy, 14, isStart ? C.lime : isEnd ? C.coral : C.white, C.black, 4);
		});

		s += chip(980, 520, "O(N × M)", C.lime);
		return s;
	},

	/** Old bridge vs new JSI */
	"React-Native-Architecture": () => {
		let s = "";
		s += displayTitle("JSI", 50, 195, 100);
		s += mono("OLD BRIDGE  →  NEW ARCHITECTURE", 58, 240, 15, C.ink, 700);

		// Old
		s += shadowBox(50, 270, 500, 290, 14, C.white, C.black, 5, 7, 7);
		s += box(50, 270, 500, 52, 14, C.coral, C.black, 5);
		s += box(50, 300, 500, 22, 0, C.coral, "none", 0);
		s += sans("OLD · BRIDGE", 70, 304, 20, C.black, 900);

		s += shadowBox(90, 350, 180, 140, 12, C.bg, C.black, 4, 5, 5);
		s += mono("JS", 180, 430, 26, C.black, 900, "middle");
		s += shadowBox(330, 350, 180, 140, 12, C.bg, C.black, 4, 5, 5);
		s += mono("NATIVE", 420, 430, 18, C.black, 900, "middle");
		s += line(280, 420, 320, 420, C.black, 4, 'stroke-dasharray="6 6"');
		s += chip(160, 510, "ASYNC JSON QUEUE", C.butter);

		// New
		s += shadowBox(650, 270, 500, 290, 14, C.white, C.black, 5, 7, 7);
		s += box(650, 270, 500, 52, 14, C.lime, C.black, 5);
		s += box(650, 300, 500, 22, 0, C.lime, "none", 0);
		s += sans("NEW · JSI", 670, 304, 20, C.black, 900);

		s += shadowBox(690, 350, 180, 140, 12, C.lime, C.black, 4, 5, 5);
		s += mono("JS", 780, 430, 26, C.black, 900, "middle");
		s += shadowBox(930, 350, 180, 140, 12, C.mint, C.black, 4, 5, 5);
		s += mono("C++", 1020, 430, 26, C.black, 900, "middle");
		s += line(880, 390, 920, 390, C.black, 6);
		s += line(920, 440, 880, 440, C.black, 6);
		s += chip(760, 510, "SYNC C++ CALLS", C.lime);
		return s;
	},

	/** useState ripples vs useRef solid box */
	"React-useRef-vs-useState": () => {
		let s = "";
		s += displayTitle("REF", 50, 195, 100);
		s += mono("vs useState · RENDER DYNAMICS", 58, 240, 16, C.ink, 700);

		// useState
		s += shadowBox(50, 270, 520, 290, 14, C.white, C.black, 5, 7, 7);
		s += box(50, 270, 520, 52, 14, C.coral, C.black, 5);
		s += box(50, 300, 520, 22, 0, C.coral, "none", 0);
		s += sans("useState(val)", 70, 304, 22, C.black, 900);

		const cx1 = 310;
		const cy1 = 430;
		for (let r = 3; r >= 1; r--) {
			s += circle(cx1, cy1, r * 28, "none", C.black, 4);
		}
		s += circle(cx1, cy1, 24, C.coral, C.black, 5);
		s += chip(190, 510, "RE-RENDERS", C.coral);

		// useRef
		s += shadowBox(630, 270, 520, 290, 14, C.white, C.black, 5, 7, 7);
		s += box(630, 270, 520, 52, 14, C.lime, C.black, 5);
		s += box(630, 300, 520, 22, 0, C.lime, "none", 0);
		s += sans("useRef(val)", 650, 304, 22, C.black, 900);

		const cx2 = 890;
		const cy2 = 430;
		s += shadowBox(cx2 - 60, cy2 - 60, 120, 120, 16, C.lime, C.black, 5, 6, 6);
		s += circle(cx2, cy2, 20, C.white, C.black, 5);
		s += chip(770, 510, "MUTABLE · NO RENDER", C.lime);
		return s;
	},

	/** Rendering strategies as solid timeline bars */
	RenderingSSR: () => {
		let s = "";
		s += displayTitle("SSR", 50, 195, 100);
		s += mono("SSG · SSR · ISR · CSR", 58, 240, 16, C.ink, 700);

		const rows = [
			{ name: "SSG  Static Generation", fill: C.lime, when: "Build Time", offset: 0 },
			{ name: "SSR  Server-Side", fill: C.sky, when: "On Request", offset: 1 },
			{ name: "ISR  Incremental", fill: C.mint, when: "Build + Revalidate", offset: 2 },
			{ name: "CSR  Client-Side", fill: C.coral, when: "Browser Hydration", offset: 3 },
		];

		s += shadowBox(50, 270, 1100, 290, 16, C.white, C.black, 6, 8, 8);

		rows.forEach((r, i) => {
			const y = 300 + i * 60;
			s += mono(r.name, 80, y + 30, 18, C.black, 800);
			// track
			s += box(420, y, 680, 44, 8, C.bg, C.black, 3);
			// filled segment
			const x = 420 + r.offset * 140;
			s += box(x, y, 200, 44, 8, r.fill, C.black, 4);
			s += mono(r.when, x + 100, y + 28, 13, C.black, 800, "middle");
		});
		return s;
	},

	/** Three solid score cards for LCP / INP / CLS */
	"Web-Vitals-Guide": () => {
		let s = "";
		s += displayTitle("VITALS", 50, 195, 92);
		s += mono("CORE WEB VITALS · FULL-STACK PERF", 58, 235, 15, C.ink, 700);

		const gauges = [
			{ label: "LCP", value: "1.2s", score: "GOOD", x: 60 },
			{ label: "INP", value: "45ms", score: "GOOD", x: 420 },
			{ label: "CLS", value: "0.01", score: "GOOD", x: 780 },
		];

		gauges.forEach((g) => {
			s += shadowBox(g.x, 265, 320, 300, 16, C.white, C.black, 5, 8, 8);
			s += box(g.x, 265, 320, 50, 16, C.lime, C.black, 5);
			s += box(g.x, 293, 320, 22, 0, C.lime, "none", 0);
			s += sans(g.label, g.x + 160, 298, 22, C.black, 900, "middle");

			const cx = g.x + 160;
			const cy = 420;
			const R = 80;
			s += path(
				`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`,
				"none",
				C.bgDeep,
				16,
			);
			s += path(
				`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R * 0.6} ${cy - R * 0.8}`,
				"none",
				C.lime,
				16,
			);
			s += circle(cx, cy, 12, C.black, C.black, 0);
			s += line(cx, cy, cx + 45, cy - 48, C.black, 5);

			s += sans(g.value, cx, 490, 28, C.black, 900, "middle");
			s += chip(cx - 40, 510, g.score, C.lime);
		});
		return s;
	},

	/** Design system tiles */
	"component-gallery": () => {
		let s = "";
		s += displayTitle("UI", 50, 195, 100);
		s += mono("EVERY BUILDING BLOCK · ONE POST", 58, 240, 15, C.ink, 700);

		const items = [
			{ x: 50, y: 270, t: "Button", sub: "<Button />", fill: C.lime },
			{ x: 340, y: 270, t: "Input", sub: "<TextField />", fill: C.white },
			{ x: 630, y: 270, t: "Badge", sub: "<Badge />", fill: C.butter },
			{ x: 920, y: 270, t: "Tabs", sub: "<Tabs />", fill: C.mint },
			{ x: 50, y: 430, t: "Callout", sub: "<Callout />", fill: C.coral },
			{ x: 340, y: 430, t: "Steps", sub: "<Steps />", fill: C.sky },
			{ x: 630, y: 430, t: "Code", sub: "<CodeBlock />", fill: C.white },
			{ x: 920, y: 430, t: "Diagram", sub: "<Mermaid />", fill: C.lilac },
		];
		items.forEach((it) => {
			s += shadowBox(it.x, it.y, 260, 120, 14, it.fill, C.black, 5, 6, 6);
			s += sans(it.t, it.x + 24, it.y + 50, 24, C.black, 900);
			s += mono(it.sub, it.x + 24, it.y + 88, 14, C.ink, 700);
		});
		return s;
	},
};

const fallbackMotif = (topic) => {
	let s = displayTitle(topic.short || "POST", 60, 200, 100);
	s += mono(topic.sub || "TECHNICAL NOTE", 70, 250, 18, C.ink, 700);
	s += shadowBox(60, 300, 500, 200, 16, C.lime, C.black, 5, 8, 8);
	s += sans(topic.category || "Article", 90, 420, 28, C.black, 900);
	return s;
};

// ---------------------------------------------------------------------------
// Frame — sleeck poster chrome (no soft glows / glass / vignettes)
// ---------------------------------------------------------------------------

function frame(topic, art) {
	const category = escapeXml(topic.category);
	const year = escapeXml(topic.year);
	const aria = escapeXml(`${topic.short} — ${topic.sub}`);

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${aria}">
  <defs>
    <!-- Halftone dots (sleeck poster texture) -->
    <pattern id="halftone" width="18" height="18" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.4" fill="${C.black}" fill-opacity="0.12"/>
    </pattern>
    <!-- Diagonal lime/white stripes (corner accent) -->
    <pattern id="stripes" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="14" height="28" fill="${C.lime}"/>
      <rect x="14" width="14" height="28" fill="${C.white}"/>
    </pattern>
  </defs>

  <!-- Solid lavender field -->
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <rect width="${W}" height="${H}" fill="url(#halftone)"/>

  <!-- Top-left stripe wedge -->
  <path d="M 0 0 L 420 0 L 280 180 L 0 180 Z" fill="url(#stripes)" stroke="${C.black}" stroke-width="0"/>
  <path d="M 0 180 L 280 180 L 240 220 L 0 220 Z" fill="${C.bgDeep}"/>

  <!-- Outer hard frame -->
  <rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="8" fill="none" stroke="${C.black}" stroke-width="5"/>

  <!-- Art (titles sit in the field; chrome overlays on top like ProjectCover) -->
  <g>${art}</g>

  <!-- Category + year chips ABOVE art so they never get painted over -->
  <g transform="translate(40, 36)">
    ${chip(0, 0, topic.category, topic.chip)}
  </g>
  <g transform="translate(${W - 150}, 36)">
    ${chip(0, 0, topic.year, C.white)}
  </g>

  <!-- Bottom caption bar -->
  <g transform="translate(40, ${H - 70})">
    <rect x="4" y="4" width="520" height="36" rx="6" fill="${C.black}"/>
    <rect x="0" y="0" width="520" height="36" rx="6" fill="${C.white}" stroke="${C.black}" stroke-width="3"/>
    ${mono(topic.sub, 16, 24, 14, C.ink, 800)}
  </g>

  <!-- Brutalist corner mark (sleeck ProjectCover) -->
  <g transform="translate(${W - 90}, ${H - 90})">
    <rect x="6" y="6" width="48" height="48" fill="${C.black}"/>
    <rect x="0" y="0" width="48" height="48" fill="${C.lime}" stroke="${C.black}" stroke-width="4"/>
    <rect x="10" y="10" width="28" height="28" fill="none" stroke="${C.black}" stroke-width="2"/>
  </g>
</svg>
`;
}

// ---------------------------------------------------------------------------
// Frontmatter helper
// ---------------------------------------------------------------------------

function withCoverImage(source, coverPath) {
	const match = source.match(/^---\n([\s\S]*?)\n---\n/);
	if (!match) return null;

	const block = match[1];
	const line = `coverImage: "${coverPath}"`;

	if (new RegExp(`^coverImage:\\s*["']?${coverPath}["']?\\s*$`, "m").test(block)) {
		return null;
	}

	const updated = /^coverImage:/m.test(block)
		? block.replace(/^coverImage:.*$/m, line)
		: /^excerpt:/m.test(block)
			? block.replace(/^excerpt:.*$/m, (m) => `${m}\n${line}`)
			: `${block}\n${line}`;

	return source.replace(match[0], `---\n${updated}\n---\n`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	const files = (await readdir(BLOGS_DIR)).filter((f) => f.endsWith(".md"));
	let wrote = 0;
	let patched = 0;

	for (const file of files) {
		const slug = file.replace(/\.md$/, "");
		const topic = TOPICS[slug] ?? DEFAULT_TOPIC;
		const motifFn = MOTIFS[slug] ?? (() => fallbackMotif(topic));

		const svg = frame(topic, motifFn(topic));
		const dir = join(OUT_DIR, slug);
		await mkdir(dir, { recursive: true });
		await writeFile(join(dir, "cover.svg"), svg, "utf8");
		wrote++;

		const postPath = join(BLOGS_DIR, file);
		const source = await readFile(postPath, "utf8");
		const updated = withCoverImage(source, `/images/blog/${slug}/cover.svg`);
		if (updated) {
			await writeFile(postPath, updated, "utf8");
			patched++;
		}

		if (!TOPICS[slug]) {
			console.warn(`[covers] ${slug}: no topic metadata — used fallback motif.`);
		}
	}

	console.log(`[covers] Wrote ${wrote} cover(s), updated ${patched} post(s).`);
}

main();
