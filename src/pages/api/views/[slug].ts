import type { APIRoute } from "astro";
import clientPromise from "@/lib/mongo";
import { randomUUID } from "crypto";

export const prerender = false;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const OPTIONS: APIRoute = async () => new Response(null, { headers: corsHeaders });

export const GET: APIRoute = async ({ params, cookies, clientAddress, request }) => {
  const slug = params?.slug as string;
  const client = await clientPromise;
  const db = client.db("Blog");

  // Collections
  const posts = db.collection("posts");
  const viewsEvents = db.collection("views"); // stores per-viewer view tokens with TTL

  // Ensure indexes (idempotent + safe to call). Prevent dupes and auto-expire tokens.
  // Unique key per slug + viewer (cookie/IP) within the TTL window.
  await Promise.all([
    viewsEvents.createIndex({ slug: 1, viewer: 1 }, { unique: true }),
    viewsEvents.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }),
  ]);

  // Make sure the post doc exists so we can always return a count
  await posts.updateOne(
    { slug },
    { $setOnInsert: { slug, views: 0, likes: 0, comments: [] } },
    { upsert: true }
  );

  // Build a stable viewer identifier
  const cookieName = "viewerId";
  const existingViewerId = cookies.get(cookieName)?.value;
  const fwdFor = request.headers.get("x-forwarded-for") || "";
  const ip = (clientAddress || fwdFor.split(",")[0] || request.headers.get("x-real-ip") || "").toString();
  // Prefer existing cookie; otherwise fall back to IP for this request to avoid per-request UUIDs
  const viewerKey = existingViewerId || ip || "unknown";

  // If no cookie existed, set one for future requests (but don't use it for this request's key)
  if (!existingViewerId) {
    cookies.set(cookieName, randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  // Throttle window: only count one view per viewerKey per slug within this window
  const WINDOW_SECONDS = 60 * 60; // 1 hour
  const expireAt = new Date(Date.now() + WINDOW_SECONDS * 1000);

  let incremented = false;
  try {
    // Attempt to record a view token; only the first within the window will succeed
    await viewsEvents.insertOne({ slug, viewer: viewerKey, expireAt });
    await posts.updateOne({ slug }, { $inc: { views: 1 } });
    incremented = true;
  } catch (err: any) {
    // Duplicate key error => already viewed within window; ignore increment
    if (err && err.code === 11000) {
      incremented = false;
    } else {
      // For unexpected errors, do not block returning the current count
      // (Optionally log in real app)
    }
  }

  const post = await posts.findOne<{ views?: number }>({ slug });
  const views = post?.views ?? (incremented ? 1 : 0);

  return new Response(JSON.stringify({ views }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
};
