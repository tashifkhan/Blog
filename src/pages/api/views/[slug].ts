import type { APIRoute } from "astro";
import clientPromise from "@/lib/mongo";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const slug = params?.slug as string;
  const client = await clientPromise;
  const db = client.db("Blog");
  const collection = db.collection("posts");

  let post = await collection.findOne<{ slug: string; views?: number; likes?: number; comments?: any[] }>({ slug });

  if (!post) {
    await collection.insertOne({ slug, views: 1, likes: 0, comments: [] });
    return new Response(JSON.stringify({ views: 1 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const updated = await collection.findOneAndUpdate(
    { slug },
    { $inc: { views: 1 } },
    { returnDocument: "after" }
  );

  const views = updated?.views ?? (post.views ?? 0) + 1;

  return new Response(JSON.stringify({ views }), {
    headers: { "Content-Type": "application/json" },
  });
};
