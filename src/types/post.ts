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