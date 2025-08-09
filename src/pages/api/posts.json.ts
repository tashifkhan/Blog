import type { APIRoute } from "astro";

// Emit this endpoint as a static JSON file at build time
export const prerender = true;

export const GET: APIRoute = async () => {
  // Correct path: from src/pages/api -> ../../blogs
  // Support both .md and .mdx so authors can choose either
  const modules = import.meta.glob("../../blogs/*.{md,mdx}");
  const postPromises = Object.entries(modules).map(async ([file, resolver]) => {
    const mod: any = await resolver();
    const filename = file.split("/").pop() || "";
    const slug = filename.replace(/\.(md|mdx)$/i, "");
    return {
      ...mod.frontmatter,
      slug,
    };
  });
  const postList = await Promise.all(postPromises);
  // Sort newest first if date exists
  postList.sort((a: any, b: any) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime());
  return new Response(JSON.stringify(postList), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};