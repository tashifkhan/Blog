import type { APIRoute } from "astro";
import { getAllPosts } from "@/lib/posts";

// Blog posts are authored in src/blogs/*.md, so the feed is derived from the
// same source as every listing page — no backend round-trip. The full
// markdown body goes in <description> wrapped in CDATA.
export const prerender = true;

const SITE = "https://blog.tashif.codes";
const FEED_TITLE = "BlogOS — Tashif Ahmad Khan";
const FEED_DESCRIPTION =
	"Articles, tutorials, and resources on web development, programming, and technology.";

const escapeXml = (value: string): string =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");

const cdata = (value: string): string =>
	`<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

const rfc822 = (date?: string | Date): string =>
	new Date(date ?? Date.now()).toUTCString();

export const GET: APIRoute = async () => {
	const posts = await getAllPosts();

	const items = posts
		.filter((post) => post.frontmatter?.title)
		.map((post) => {
			const { frontmatter } = post;
			const url = `${SITE}/blog/${post.slug}`;
			const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
			const categories = tags
				.map((tag) => `\n\t\t<category>${escapeXml(String(tag))}</category>`)
				.join("");
			const author =
				typeof frontmatter.author === "string" && frontmatter.author
					? `\n\t\t<author>${escapeXml(frontmatter.author)}</author>`
					: "";
			const description = cdata(
				post.rawContent || (frontmatter.excerpt ? String(frontmatter.excerpt) : "")
			);

			return `\t<item>
\t\t<title>${escapeXml(String(frontmatter.title))}</title>
\t\t<link>${escapeXml(url)}</link>
\t\t<guid isPermaLink="true">${escapeXml(url)}</guid>
\t\t<pubDate>${rfc822(frontmatter.date ? String(frontmatter.date) : "")}</pubDate>${categories}${author}
\t\t<description>${description}</description>
\t</item>`;
		})
		.join("\n");

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
\t<title>${escapeXml(FEED_TITLE)}</title>
\t<link>${SITE}</link>
\t<description>${escapeXml(FEED_DESCRIPTION)}</description>
\t<language>en-us</language>
\t<lastBuildDate>${rfc822()}</lastBuildDate>
\t<atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
${items}
</channel>
</rss>`;

	return new Response(xml, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, max-age=0, must-revalidate",
		},
	});
};
