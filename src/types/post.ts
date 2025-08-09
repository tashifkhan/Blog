export interface Post {
  id?: number;
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  content?: string;
}