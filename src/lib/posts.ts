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
};

export async function getAllPosts() {
  const modules = import.meta.glob("../blogs/*.{md,mdx}");
  const posts: LoadedPost[] = await Promise.all(
    Object.entries(modules).map(async ([file, resolver]) => {
      const mod: any = await resolver();
      const filename = file.split("/").pop() || "";
      const slug = filename.replace(/\.(md|mdx)$/i, "");
      return {
        slug,
        frontmatter: mod.frontmatter || {},
        Content: mod.default,
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
