import type { Post } from "@/types/post";

// Sample posts data
const posts: Post[] = [
  {
    id: 1,
    title: "Getting Started with Neobrutalism Design",
    date: "2023-05-15",
    excerpt: "An introduction to the bold and playful neobrutalism design trend and how to use it in web designs.",
    category: "Design",
    tags: ["Design", "UI/UX", "Trends"]
  },
  {
    id: 2,
    title: "Creating Custom React Hooks",
    date: "2023-04-20",
    excerpt: "Learn how to build your own custom React hooks to share stateful logic between components.",
    category: "Development",
    tags: ["React", "JavaScript", "Hooks"]
  },
  {
    id: 3,
    title: "The Power of Framer Motion",
    date: "2023-04-05",
    excerpt: "Exploring the capabilities of Framer Motion for creating fluid animations in React applications.",
    category: "Development",
    tags: ["Animation", "React", "Framer Motion"]
  },
  {
    id: 4,
    title: "Building Theme Switchers in React",
    date: "2023-03-22",
    excerpt: "A step-by-step guide to implementing theme switching functionality in React applications.",
    category: "Development",
    tags: ["React", "Theming", "CSS"]
  },
  {
    id: 5,
    title: "Designing for Accessibility",
    date: "2023-03-10",
    excerpt: "Best practices for creating accessible web interfaces that work for everyone.",
    category: "Design",
    tags: ["Accessibility", "UI/UX", "Best Practices"]
  }
];

export const PostService = {
  // Get all posts
  getAllPosts: (): Post[] => {
    return posts;
  },
  
  // Get recent posts (default to 3)
  getRecentPosts: (count: number = 3): Post[] => {
    return [...posts].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, count);
  },
  
  // Get a post by ID
  getPostById: (id: number): Post | undefined => {
    return posts.find(post => post.id === id);
  },
  
  // Search posts by title or content
  searchPosts: (query: string): Post[] => {
    const lowercaseQuery = query.toLowerCase();
    return posts.filter(post => 
      post.title.toLowerCase().includes(lowercaseQuery) || 
      post.excerpt.toLowerCase().includes(lowercaseQuery) ||
      post.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }
};