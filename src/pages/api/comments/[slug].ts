import type { APIRoute } from "astro";
import clientPromise from "@/lib/mongo";

const uuid = () => crypto.randomUUID();

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const slug = params?.slug as string;
  const client = await clientPromise;
  const db = client.db("Blog");
  const collection = db.collection("posts");

  const post = await collection.findOne<{ comments?: any[] }>({ slug });

  return new Response(
    JSON.stringify({ comments: post?.comments ?? [] }),
    { headers: { "Content-Type": "application/json" } }
  );
};

export const POST: APIRoute = async ({ params, request }) => {
  const slug = params?.slug as string;
  const body = await request.json().catch(() => ({}));
  const { name, text, parentId } = body as { name?: string; text?: string; parentId?: string };

  if (!name || !text) {
    return new Response(JSON.stringify({ error: "Name and text required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = await clientPromise;
  const db = client.db("Blog");
  const collection = db.collection("posts");

  const newComment = {
    id: uuid(),
    name,
    text,
    date: new Date().toISOString(),
    replies: [],
  };

  const post = await collection.findOne<{ comments?: any[] }>({ slug });

  if (!post) {
    await collection.insertOne({ slug, views: 0, likes: 0, comments: [newComment] });
  } else if (!parentId) {
    await collection.updateOne({ slug }, { $push: { comments: newComment } });
  } else {
    // Add reply by reconstructing nested array safely
    const addReplyRecursive = (comments: any[]): any[] =>
      comments.map((c) => {
        if (c.id === parentId) {
          return { ...c, replies: [...(c.replies || []), newComment] };
        }
        return { ...c, replies: addReplyRecursive(c.replies || []) };
      });

    const updatedComments = addReplyRecursive(post.comments || []);
    await collection.updateOne({ slug }, { $set: { comments: updatedComments } });
  }

  return new Response(
    JSON.stringify({ success: true, comment: newComment }),
    { headers: { "Content-Type": "application/json" } }
  );
};
