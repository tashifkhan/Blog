import { getAllPosts } from "@/lib/posts";
import type { Post } from "@/types/post";

const WORDS_PER_MINUTE = 200;

/**
 * Post metadata derived from src/blogs/*.md at build time.
 *
 * Shared by the /posts.json endpoint and the pages that pass initial data into
 * React, so both always agree.
 */
export async function getPostSummaries(): Promise<Post[]> {
	const posts = await getAllPosts();

	return posts.map(({ slug, frontmatter, rawContent }) => {
		const wordCount = rawContent.split(/\s+/).filter(Boolean).length;

		const coverImage =
			typeof frontmatter.coverImage === "string" && frontmatter.coverImage
				? frontmatter.coverImage
				: undefined;

		return {
			slug,
			title: frontmatter.title ?? slug,
			date: frontmatter.date ? String(frontmatter.date) : "",
			excerpt: frontmatter.excerpt,
			coverImage,
			category: frontmatter.category,
			tags: frontmatter.tags ?? [],
			author: frontmatter.author,
			wordCount,
			readingTimeMinutes: Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)),
		};
	});
}
