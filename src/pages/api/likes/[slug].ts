import type { APIRoute } from "astro";
import clientPromise from "@/lib/mongo";

export const prerender = false;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const OPTIONS: APIRoute = async () => new Response(null, { headers: corsHeaders });

export const GET: APIRoute = async ({ params }) => {
  try {
    const slug = params?.slug as string;
    const client = await clientPromise;
    const db = client.db("Blog");
    const collection = db.collection("posts");
    const post = await collection.findOne<{ likes?: number }>({ slug });
    return new Response(JSON.stringify({ likes: post?.likes ?? 0 }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Failed to load likes" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

export const POST: APIRoute = async ({ params }) => {
  try {
    const slug = params?.slug as string;
    const client = await clientPromise;
    const db = client.db("Blog");
    const collection = db.collection("posts");

    const result = await collection.findOneAndUpdate(
      { slug },
      { $inc: { likes: 1 }, $setOnInsert: { views: 0, comments: [] } },
      { upsert: true, returnDocument: "after" }
    );

    const likes = (result && (result as any).likes) ?? (result && (result as any).value?.likes) ?? 1;
    return new Response(JSON.stringify({ likes }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Failed to update likes" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};
