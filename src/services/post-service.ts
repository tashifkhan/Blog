// Define the Post interface inline
export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  imageUrl?: string;
  author: {
    name: string;
    avatar?: string;
  };
  tags: string[];
}

// Sample mock data
const mockPosts: Post[] = [
  {
    id: "1",
    slug: "getting-started-with-astro",
    title: "Getting Started with Astro",
    excerpt:
      "Learn how to build fast websites with Astro, the all-in-one web framework designed for speed.",
    content:
      "Astro is an all-in-one web framework for building fast, content-focused websites...",
    date: "2023-05-15T12:00:00Z",
    imageUrl: "https://picsum.photos/800/400?random=1",
    author: {
      name: "Astro Developer",
      avatar: "https://i.pravatar.cc/100?u=astro",
    },
    tags: ["astro", "web development", "javascript"],
  },
  {
    id: "2",
    slug: "react-in-2023",
    title: "React in 2023: What's New",
    excerpt:
      "Explore the latest features and improvements in React's ecosystem for this year.",
    content:
      "React continues to evolve with new features like server components...",
    date: "2023-06-20T12:00:00Z",
    imageUrl: "https://picsum.photos/800/400?random=2",
    author: {
      name: "React Expert",
      avatar: "https://i.pravatar.cc/100?u=react",
    },
    tags: ["react", "javascript", "frontend"],
  },
  {
    id: "3",
    slug: "css-grid-layouts",
    title: "Mastering CSS Grid Layouts",
    excerpt:
      "Learn how to create complex web layouts with CSS Grid that work across all browsers.",
    content: "CSS Grid has revolutionized how we approach web layouts...",
    date: "2023-04-10T12:00:00Z",
    imageUrl: "https://picsum.photos/800/400?random=3",
    author: {
      name: "CSS Wizard",
      avatar: "https://i.pravatar.cc/100?u=css",
    },
    tags: ["css", "web design", "layout"],
  },
  {
    id: "4",
    slug: "typescript-best-practices",
    title: "TypeScript Best Practices in 2023",
    excerpt:
      "Discover the most effective patterns and practices for TypeScript development.",
    content:
      "TypeScript continues to gain adoption, and with it comes evolving best practices...",
    date: "2023-07-05T12:00:00Z",
    imageUrl: "https://picsum.photos/800/400?random=4",
    author: {
      name: "TS Developer",
      avatar: "https://i.pravatar.cc/100?u=typescript",
    },
    tags: ["typescript", "javascript", "development"],
  },
];

export class PostService {
  // Safe method to get all posts
  static getPosts(): Post[] {
    // Return mock data
    return [...mockPosts];
  }

  // Get recent posts (most recent 3)
  static getRecentPosts(): Post[] {
    const sortedPosts = [...mockPosts].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    return sortedPosts.slice(0, 3);
  }

  // Search posts by title or content
  static searchPosts(query: string): Post[] {
    if (!query) return [];
    
    const lowerQuery = query.toLowerCase();
    return mockPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(lowerQuery) ||
        post.excerpt.toLowerCase().includes(lowerQuery) ||
        post.content.toLowerCase().includes(lowerQuery) ||
        post.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Get a post by slug
  static getPostBySlug(slug: string): Post | undefined {
    return mockPosts.find((post) => post.slug === slug);
  }
}