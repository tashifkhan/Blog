export interface Post {
  id?: number;
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  /** Public path to the cover image, e.g. `/images/blog/Slug/cover.webp`. */
  coverImage?: string;
  category?: string;
  tags?: string[];
  content?: string;
  author?: string;
  wordCount?: number;
  readingTimeMinutes?: number;
}
