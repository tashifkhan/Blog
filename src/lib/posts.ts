export type LoadedPost = {
  slug: string;
  frontmatter: Record<string, any> & {
    title?: string;
    date?: string;
    excerpt?: string;
    tags?: string[];
  };
  // Default export is the compiled MD/MDX component
  Content: any;
  // Raw markdown content for MarkdownRenderer
  rawContent: string;
};

export async function getAllPosts() {
  const modules = import.meta.glob("../blogs/*.{md,mdx}");
  const rawFiles = import.meta.glob("../blogs/*.{md,mdx}", { query: "?raw", import: "default" });
  
  const posts: LoadedPost[] = await Promise.all(
    Object.entries(modules).map(async ([file, resolver]) => {
      const mod: any = await resolver();
      const rawResolver = rawFiles[file];
      const rawContent = rawResolver ? (await rawResolver()) as string : "";
      
      const filename = file.split("/").pop() || "";
      const slug = filename.replace(/\.(md|mdx)$/i, "");
      
      // Extract frontmatter from raw content
      const frontmatterMatch = rawContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      const contentWithoutFrontmatter = frontmatterMatch ? frontmatterMatch[2] : rawContent;
      
      return {
        slug,
        frontmatter: mod.frontmatter || {},
        Content: mod.default,
        rawContent: contentWithoutFrontmatter,
      };
    })
  );
  return posts.sort(
    (a, b) => new Date(b.frontmatter?.date || 0).getTime() - new Date(a.frontmatter?.date || 0).getTime()
  );
}

export async function getPostBySlug(slug: string) {
  const posts = await getAllPosts();
  return posts.find((p) => p.slug === slug);
}
