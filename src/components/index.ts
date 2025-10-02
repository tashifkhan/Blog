// Main components
export { Desktop } from "./Desktop";
export { HomePage } from "./HomePage";
export { BlogPage } from "./BlogPage";
export { BlogPostWrapper } from "./BlogPostWrapper";

// Window components
export { WelcomeWindow } from "./WelcomeWindow";
export { BlogWindow } from "./BlogWindow";
export { BlogPostPage } from "./BlogPostPage";
export { RecentPostsWindow } from "./RecentPostsWindow";

// Section components
export { BlogSection } from "./sections/blog-section";

// Legacy component (for backward compatibility)
export { default as Navbar } from "./navbar";

// Table of Contents components
export { TableOfContentsMenu } from "./menu/table-of-contents-menu";
export { MobileTableOfContents } from "./mobile/MobileTableOfContents";

// Note: MarkdownRenderer.astro is an Astro component and should be imported directly
// import MarkdownRenderer from "./MarkdownRenderer.astro";
