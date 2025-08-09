import type { APIRoute } from "astro";
import clientPromise from "@/lib/mongo";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const slug = params?.slug as string;
  const client = await clientPromise;
  const db = client.db("Blog");
  const collection = db.collection("posts");

  const post = await collection.findOne<{ likes?: number }>({ slug });
  return new Response(JSON.stringify({ likes: post?.likes ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ params }) => {
  const slug = params?.slug as string;
  const client = await clientPromise;
  const db = client.db("Blog");
  const collection = db.collection("posts");

  const updated = await collection.findOneAndUpdate(
    { slug },
    { $inc: { likes: 1 }, $setOnInsert: { views: 0, comments: [] } },
    { upsert: true, returnDocument: "after" }
  );

  return new Response(JSON.stringify({ likes: updated?.likes ?? 1 }), {
    headers: { "Content-Type": "application/json" },
  });
};
