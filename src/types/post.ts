export interface Post {
  id: number;
  title: string;
  date: string;
  excerpt: string;
  category?: string;
  tags?: string[];
  content?: string;
}