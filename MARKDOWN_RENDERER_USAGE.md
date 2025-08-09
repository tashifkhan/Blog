# MarkdownRenderer Component

This component provides a powerful markdown renderer with syntax highlighting, copy functionality, and beautiful styling that adheres to your blog's theme.

## Features

- **Syntax Highlighting**: Uses Prism.js with support for multiple languages
- **Copy Code Functionality**: Click-to-copy buttons on code blocks
- **Responsive Design**: Mobile-optimized styling
- **Dark/Light Theme Support**: Automatically adapts to your theme
- **GitHub URL Support**: Converts relative URLs to GitHub raw URLs
- **Enhanced Typography**: Beautiful styling for all markdown elements

## Usage

```astro
---
import MarkdownRenderer from "../components/MarkdownRenderer.astro";

const markdownContent = `
# Your Markdown Content

This is a **bold** text and this is *italic*.

\`\`\`javascript
console.log("Hello, World!");
\`\`\`

- List item 1
- List item 2
- List item 3
`;
---

<MarkdownRenderer
  content={markdownContent}
  githubBaseUrl="https://github.com/your-username/your-repo"
/>
```

## Props

- `content` (string): The markdown content to render
- `githubBaseUrl` (string, optional): Base GitHub URL for converting relative image/link URLs

## Styling Features

### Code Blocks

- Language labels in the top-right corner
- Copy buttons that appear on hover
- Syntax highlighting with Prism.js
- Line numbers support
- Mobile-responsive scrolling

### Typography

- Responsive headings with gradient accent bars
- Enhanced links with hover effects
- Styled lists with custom bullet points
- Beautiful blockquotes with left borders
- Responsive tables with hover effects

### Theme Integration

- Automatically adapts to light/dark themes
- Uses your existing CSS custom properties
- Orange accent colors matching your brand
- Proper contrast ratios for accessibility

## Dependencies

This component requires the following packages (already installed):

- `remark`
- `remark-html`
- `remark-gfm`
- `rehype-prism-plus`

## Example in Blog Posts

You can now use this component in your blog layouts:

```astro
---
// In your blog layout or page
import MarkdownRenderer from "../components/MarkdownRenderer.astro";
import { getPost } from "../lib/posts";

const { slug } = Astro.params;
const post = await getPost(slug);
---

<article>
  <h1>{post.title}</h1>
  <MarkdownRenderer
    content={post.content}
    githubBaseUrl="https://github.com/tashifkhan/Blog"
  />
</article>
```

The component seamlessly integrates with your existing design system and provides a professional, modern reading experience for your blog posts.
