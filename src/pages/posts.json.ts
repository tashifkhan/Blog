import type { APIRoute } from "astro";
import { getPostSummaries } from "@/lib/post-summaries";

// Post metadata is derived from src/blogs/*.md at build time and emitted as a
// static asset. This is the single source of truth for post listings: it works
// identically in `astro dev` and in production, with no backend round-trip.
//
// It deliberately does NOT live under /api — vercel.json rewrites /api/* to the
// Python function, which would shadow this route. The Python API owns engagement
// (views/likes/comments) only.
export const prerender = true;

export const GET: APIRoute = async () => {
	const summaries = await getPostSummaries();

	return new Response(JSON.stringify(summaries), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=0, must-revalidate",
		},
	});
};
