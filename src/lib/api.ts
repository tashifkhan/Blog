// Centralized API base using Astro public env.
// Default to relative /api for single-project Vercel deployment.
// For split local dev, set PUBLIC_API_URL to something like http://localhost:8000.

const BASE =
  (import.meta.env.PUBLIC_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "/api";

export function apiUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${p}`;
}

export async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(apiUrl(path), init);
  return res;
}

export async function fetchJSON(path: string, init?: RequestInit) {
  const res = await apiFetch(path, init);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}
