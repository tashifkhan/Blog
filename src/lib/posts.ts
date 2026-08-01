export type LoadedPost = {
  slug: string;
  frontmatter: Record<string, any> & {
    title?: string;
    date?: string;
    excerpt?: string;
    coverImage?: string;
    tags?: string[];
  };
  /** Post body with the frontmatter block stripped. */
  rawContent: string;
};

/**
 * Load every post from src/blogs/.
 *
 * Only the frontmatter is taken from Astro's compiled module — the body is read
 * raw and handed to MarkdownRenderer. Posts are plain `.md`: the previous
 * `.mdx` glob compiled every file to a component that nothing rendered, which
 * made MDX look supported when the compiled output was always discarded.
 */
export async function getAllPosts() {
  const modules = import.meta.glob("../blogs/*.md");
  const rawFiles = import.meta.glob("../blogs/*.md", {
    query: "?raw",
    import: "default",
  });

  const posts: LoadedPost[] = await Promise.all(
    Object.entries(modules).map(async ([file, resolver]) => {
      const mod: any = await resolver();
      const rawResolver = rawFiles[file];
      const rawContent = rawResolver ? ((await rawResolver()) as string) : "";

      const filename = file.split("/").pop() || "";
      const slug = filename.replace(/\.md$/i, "");

      const frontmatterMatch = rawContent.match(
        /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
      );
      const contentWithoutFrontmatter = frontmatterMatch
        ? frontmatterMatch[2]
        : rawContent;

      return {
        slug,
        frontmatter: mod.frontmatter || {},
        rawContent: contentWithoutFrontmatter,
      };
    })
  );
  return posts.sort(
    (a, b) =>
      new Date(b.frontmatter?.date || 0).getTime() -
      new Date(a.frontmatter?.date || 0).getTime()
  );
}

export async function getPostBySlug(slug: string) {
  const posts = await getAllPosts();
  return posts.find((p) => p.slug === slug);
}
