import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const modules = import.meta.glob("../../../blogs/*.mdx");
  const postPromises = Object.entries(modules).map(async ([file, resolver]) => {
    const mod: any = await resolver();
    const slug = file.split("/").pop()?.replace(/\.mdx$/, "");
    return {
      ...mod.frontmatter,
      slug,
    };
  });
  const postList = await Promise.all(postPromises);
  return new Response(JSON.stringify(postList), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}; 