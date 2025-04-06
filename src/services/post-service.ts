import type { Post } from "../types/post";

// Sample post data - in a real app, this would likely come from an API
const posts: Post[] = [
  { id: 1, title: "Getting Started with React", date: "2023-10-15", excerpt: "Learn the basics of React and how to create your first component." },
  { id: 2, title: "CSS Grid Layout", date: "2023-10-10", excerpt: "Master CSS Grid to create complex layouts with ease." },
  { id: 3, title: "JavaScript Promises", date: "2023-10-05", excerpt: "Understanding asynchronous JavaScript with Promises." },
  { id: 4, title: "TypeScript Basics", date: "2023-10-01", excerpt: "Why you should use TypeScript in your next project." },
  { id: 5, title: "Web Accessibility", date: "2023-09-28", excerpt: "Making your websites accessible to everyone." },
  { id: 6, title: "State Management with Redux", date: "2023-09-25", excerpt: "Learn how to manage complex state in your React applications." }
];

export const PostService = {
  getAllPosts: (): Post[] => {
    return [...posts];
  },
  
  getRecentPosts: (count: number = 4): Post[] => {
    return [...posts].slice(0, count);
  },
  
  getPostById: (id: number): Post | undefined => {
    return posts.find(post => post.id === id);
  },
  
  searchPosts: (query: string): Post[] => {
    if (!query) return [];
    
    const lowercasedQuery = query.toLowerCase();
    return posts.filter(post => 
      post.title.toLowerCase().includes(lowercasedQuery) || 
      post.excerpt.toLowerCase().includes(lowercasedQuery)
    );
  }
};