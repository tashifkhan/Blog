import { useEffect, useMemo, useState } from "react";
import type { Post } from "@/types/post";

const POSTS_ENDPOINT = "/posts.json";

// Module-level cache so multiple mounted components share one request instead of
// each firing their own fetch on mount.
let postsCache: Post[] | null = null;
let inflight: Promise<Post[]> | null = null;

function loadPosts(): Promise<Post[]> {
	if (postsCache) return Promise.resolve(postsCache);
	if (!inflight) {
		inflight = fetch(POSTS_ENDPOINT)
			.then((res) => {
				if (!res.ok) throw new Error(`Failed to load posts: ${res.status}`);
				return res.json() as Promise<Post[]>;
			})
			.then((data) => {
				postsCache = data;
				return data;
			})
			.finally(() => {
				inflight = null;
			});
	}
	return inflight;
}

function byDateDesc(a: Post, b: Post) {
	return new Date(b.date).getTime() - new Date(a.date).getTime();
}

export interface UsePostsResult {
	posts: Post[];
	recentPosts: Post[];
	isLoading: boolean;
	error: Error | null;
}

/**
 * Single source of post data for client components. Replaces the four
 * copy-pasted `fetch("/api/posts.json")` blocks that previously lived in
 * Desktop, MobileHome, MobilePostsList and navbar.
 */
export function usePosts(
	recentCount = 3,
	initialPosts?: Post[]
): UsePostsResult {
	// Posts supplied by Astro at build time seed the cache, so the very first
	// render (server and client) already has content and no fetch is needed.
	if (initialPosts && initialPosts.length > 0 && postsCache === null) {
		postsCache = [...initialPosts].sort(byDateDesc);
	}

	const [posts, setPosts] = useState<Post[]>(postsCache ?? []);
	const [isLoading, setIsLoading] = useState(postsCache === null);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let cancelled = false;

		loadPosts()
			.then((data) => {
				if (cancelled) return;
				setPosts([...data].sort(byDateDesc));
			})
			.catch((err) => {
				if (cancelled) return;
				setError(err instanceof Error ? err : new Error(String(err)));
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	const recentPosts = useMemo(
		() => posts.slice(0, recentCount),
		[posts, recentCount]
	);

	return { posts, recentPosts, isLoading, error };
}

/** Case-insensitive match across title, excerpt and tags. */
export function searchPosts(posts: Post[], query: string): Post[] {
	const q = query.trim().toLowerCase();
	if (!q) return [];
	return posts.filter(
		(p) =>
			p.title?.toLowerCase().includes(q) ||
			p.excerpt?.toLowerCase().includes(q) ||
			p.tags?.some((tag) => tag.toLowerCase().includes(q))
	);
}
