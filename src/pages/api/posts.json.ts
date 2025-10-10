import type { APIRoute } from "astro";

// Emit this endpoint as a static JSON file at build time
export const prerender = true;

export const GET: APIRoute = async () => {
  // Correct path: from src/pages/api -> ../../blogs
  // Support both .md and .mdx so authors can choose either
  const modules = import.meta.glob("../../blogs/*.{md,mdx}");
  // Load raw markdown as well so we can calculate word counts / reading time
  const rawFiles = import.meta.glob("../../blogs/*.{md,mdx}", { query: "?raw", import: "default" });
  const postPromises = Object.entries(modules).map(async ([file, resolver]) => {
    const mod: any = await resolver();
    const filename = file.split("/").pop() || "";
    const slug = filename.replace(/\.(md|mdx)$/i, "");

    // Try to get the raw markdown for this file to compute word count
    const rawResolver = rawFiles[file];
    const rawContent = rawResolver ? (await rawResolver()) as string : "";

    // Strip YAML frontmatter if present to get only the content
    const frontmatterMatch = rawContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    const contentWithoutFrontmatter = frontmatterMatch ? frontmatterMatch[2] : rawContent;

    // Sanitize content a bit: remove code fences, inline code, HTML tags, and images
    let sanitized = contentWithoutFrontmatter
      .replace(/```[\s\S]*?```/g, " ") // code fences
      .replace(/`[^`]*`/g, " ") // inline code
      .replace(/<[^>]+>/g, " ") // HTML tags
      .replace(/!\[[^\]]*\]\([^\)]+\)/g, " ") // images
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1"); // links: keep link text

    // Collapse remaining non-word characters to spaces and count words
    const words = sanitized.trim().length === 0 ? 0 : sanitized.trim().split(/\s+/).filter(Boolean).length;

    // Reading speed: 200 words per minute, rounded up, minimum 1 minute if there are words
    const wpm = 200;
    const readingTimeMinutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / wpm));

    return {
      ...mod.frontmatter,
      slug,
      wordCount: words,
      readingTimeMinutes,
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