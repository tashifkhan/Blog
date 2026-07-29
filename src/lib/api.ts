// Client for the engagement API (views / likes / comments), served by the
// FastAPI app in server/.
//
// Post *content* does not come from here — it is emitted at build time by
// src/pages/posts.json.ts. This module is engagement-only.
//
// The FastAPI app mounts every router under an "/api" prefix (server/main.py).
// In production vercel.json rewrites /api/* to the Python function on the same
// origin, so the default relative base is correct. For local development, run
// the backend separately and point PUBLIC_API_URL at it *including* the prefix:
//
//   PUBLIC_API_URL="http://localhost:8000/api"
//
// A base without the /api suffix was the previous configuration and produced
// 404s on every engagement call.

const RAW_BASE = import.meta.env.PUBLIC_API_URL as string | undefined;

function normalizeBase(raw: string | undefined): string {
	if (!raw) return "/api";
	const trimmed = raw.trim().replace(/\/+$/, "");
	if (!trimmed) return "/api";
	// Tolerate a base configured without the router prefix.
	return /\/api$/.test(trimmed) ? trimmed : `${trimmed}/api`;
}

const BASE = normalizeBase(RAW_BASE);

export function apiUrl(path: string): string {
	const p = path.startsWith("/") ? path : `/${path}`;
	return `${BASE}${p}`;
}

export class ApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly path: string
	) {
		super(message);
		this.name = "ApiError";
	}
}

export async function apiFetch(
	path: string,
	init?: RequestInit
): Promise<Response> {
	return fetch(apiUrl(path), {
		...init,
		headers: {
			...(init?.body ? { "Content-Type": "application/json" } : {}),
			...init?.headers,
		},
	});
}

// Recording a view is a POST (it mutates). Multiple components render view
// counts on a post page, so the request is deduplicated per slug per page load
// to avoid firing several identical writes.
const viewRequests = new Map<string, Promise<number>>();

export function recordView(slug: string): Promise<number> {
	const existing = viewRequests.get(slug);
	if (existing) return existing;

	const request = fetchJSON<{ views: number }>(`/views/${slug}`, {
		method: "POST",
	})
		.then((data) => data.views ?? 0)
		.catch((err) => {
			// Allow a later retry if this attempt failed.
			viewRequests.delete(slug);
			throw err;
		});

	viewRequests.set(slug, request);
	return request;
}

export async function fetchJSON<T = unknown>(
	path: string,
	init?: RequestInit
): Promise<T> {
	const res = await apiFetch(path, init);
	if (!res.ok) {
		throw new ApiError(
			`Request to ${path} failed: ${res.status} ${res.statusText}`,
			res.status,
			path
		);
	}
	return (await res.json()) as T;
}
