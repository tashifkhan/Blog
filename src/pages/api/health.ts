import type { APIRoute } from "astro";
import clientPromise from "@/lib/mongo";

export const prerender = false;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const OPTIONS: APIRoute = async () => new Response(null, { headers: corsHeaders });

export const GET: APIRoute = async () => {
  const node = process.version;
  const hasEnv = Boolean(process.env.MONGODB_URI || import.meta.env.MONGODB_URI);
  let mongo = { ok: false as boolean, error: undefined as undefined | string };
  if (hasEnv) {
    try {
      const client = await clientPromise;
      await client.db("admin").command({ ping: 1 });
      mongo.ok = true;
    } catch (e: any) {
      mongo = { ok: false, error: e?.message || String(e) };
    }
  }
  return new Response(
    JSON.stringify({ ok: true, node, env: { MONGODB_URI: hasEnv }, mongo }),
    { headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
};
