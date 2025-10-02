---
title: "Various Rendering Strategies of Web Frameworks"
date: 2025-06-23
author: "Tashif Ahmad Khan"
socials:
  [
    "https://www.github.com/tashifkhan",
    "https://www.linkedin.com/in/tashif-ahmad-khan-982304244/",
    "https://tashif.codes",
  ]
tags: ["web development", "rendering", "ssr", "spa", "mpa"]
excerpt: "A deep dive into the various rendering strategies of web frameworks."
---

The world of web development is a constantly evolving landscape, and one of its most dynamic areas is how web applications are rendered. Gone are the days when the choice was simply "send HTML" or "send JavaScript." Today, we live in an era where techniques are blended, offering a spectrum of benefits and trade-offs. Understanding these different approaches is crucial for any modern web developer.

Let's dive into the core strategies and how various popular frameworks implement them.

## 1. Classic Multi-Page Apps (MPA): The HTML Foundation

At its heart, the web was built on the Multi-Page Application (MPA) model. When a user requests a page, the server generates and sends back a complete HTML document. If the user clicks a link, the browser makes another request to the server, which then responds with an entirely new HTML page.

**How it works:**

- **User navigates to `example.com`:**
  - Browser requests page from server.
  - Server (e.g., running Flask with Jinja2 templates, or simply serving static HTML files) processes the request.
  - Server generates or retrieves the full HTML for `index.html` (potentially embedding dynamic data like a username).
  - Server sends the complete HTML document to the browser.
  - Browser renders the HTML.
- **User clicks a link to `example.com/about`:**
  - Browser makes a new request to the server.
  - Server processes, generates, or retrieves the full HTML for `about.html`.
  - Server sends the complete HTML.
  - Browser completely reloads the page with the new HTML.

**Examples:**

- Vanilla HTML pages
- Server-side templating engines like **Flask (Jinja2)**, PHP, Ruby on Rails, Django.

**Pros:**

- **Excellent for SEO:** Search engine crawlers get full, pre-rendered HTML immediately.
- **Fast initial load (for static content):** No JavaScript execution required to display content.
- **Simple architecture:** Less complexity in the client-side.

**Cons:**

- **"Janky" navigation:** Every click results in a full page reload, leading to a blank screen or a visible loading bar.
- **No persistent UI elements:** Elements like a media player or a chat window cannot persist across navigations without complex server-side state management.

### HTMX: Modernizing the MPA

**HTMX** takes the MPA concept and supercharges it. Instead of full page reloads, HTMX allows specific elements on the page to trigger AJAX requests that return _HTML fragments_ (not JSON). This HTML fragment then replaces a specified part of the current page. This gives a "SPA-like" feel without needing a large client-side JavaScript framework.

## 2. Classic Single-Page Apps (SPA): Client-Side Dominance

The rise of powerful client-side JavaScript introduced the Single-Page Application (SPA) model. In an SPA, the server initially sends a minimal HTML scaffold, often just an empty `<body>` tag and a `<script>` tag. The vast majority of the application's UI is then rendered, managed, and navigated client-side using JavaScript.

**How it works:**

- **User navigates to `example.com`:**
  - Browser requests page from server.
  - Server sends a minimal HTML file (a "skeleton") containing a `<script>` tag referencing the main JavaScript bundle.
  - Browser downloads and parses this initial HTML.
  - Browser then fetches the JavaScript bundle(s) (e.g., `app.js`).
  - Once the JavaScript loads, it starts executing, making API calls (e.g., to `api.example.com/data`) to fetch necessary data (usually JSON).
  - Client-side JavaScript (e.g., React) uses this data to dynamically build and insert the full UI into the DOM.
  - Finally, the page is "loaded" and visible.
- **User clicks a link to `example.com/about`:**
  - Client-side JavaScript (e.g., React Router) intercepts the navigation.
  - It updates the browser's URL (without a full page reload).
  - It then renders the appropriate UI components for the `/about` path, potentially making new API calls for data specific to that page. The user sees an "instant" UI change, perhaps with loading spinners for dynamic content.

**Example:**

- **React** (without server-side rendering setup), Vue, Angular.

**Pros:**

- **Fluid user experience:** Instantaneous navigations and smooth transitions after the initial load.
- **Persistent UI elements:** Easy to maintain elements like video players or global chat widgets across navigations.
- **Rich interactivity:** Ideal for complex, highly interactive applications.

**Cons:**

- **Slow initial load:** A "waterfall" of requests (HTML -> JS -> Data) means the user sees a blank or incomplete page until all assets and data are fetched and processed.
- **Poor SEO (historically):** Search engine crawlers struggled to index content that required JavaScript execution.
- **Large JavaScript bundles:** The entire application's logic and often a lot of its data fetching logic must be sent to the client. This increases initial download size.
- **Client-side burden:** Heavy reliance on the client's CPU and memory to parse and render the application.

## 3. Server-Side Rendered (SSR) SPAs: Bridging the Gap

To address the SEO and initial load performance issues of classic SPAs, Server-Side Rendering (SSR) emerged. With SSR, the initial request for a page is handled by a server-side JavaScript runtime (like Node.js) that executes the same application code that would normally run in the browser. This generates the complete HTML on the server and sends it to the client. Once on the client, the JavaScript then "hydrates" the already-rendered HTML, making it interactive.

**How it works:**

- **User navigates to `example.com`:**
  - Browser requests page from server.
  - Server (e.g., **Next.js** running a Node.js server) executes the React application code, fetches data, and generates the _full HTML_ for the initial view.
  - Server sends this complete HTML (with embedded data, often in a `__NEXT_DATA__` script tag) to the browser.
  - Browser immediately displays the content because it's full HTML.
  - In parallel, the browser downloads the JavaScript bundle.
  - Once JS loads, it "hydrates" the existing HTML: it re-runs the same React code on the client, attaching event listeners and making the UI interactive. If a button is clicked _before_ hydration, it won't work.
- **User clicks a link to `example.com/about`:**
  - **Next.js (Pages Directory)**: The framework often makes an API call to the server to get a JSON "data blob" for the new page. The server processes the request (similar to the initial render, but just returning data). Once the JSON is received, the client-side JavaScript updates the UI. This can still block navigation until the data arrives.

**Example:**

- **Next.js (using the "Pages" directory router)**, Gatsby (for static SSR), Nuxt.js, SvelteKit.

**Pros:**

- **Better SEO:** Crawlers get full HTML upfront.
- **Improved initial performance:** Users see content immediately; time-to-first-byte (TTFB) is good.
- **Interactive content:** Pages become interactive after hydration.

**Cons:**

- **"Double data" problem:** The content is sent twice: once as HTML, and again embedded in JavaScript (or fetched by JS) so the client can hydrate. This increases bundle sizes.
- **Time to interactivity:** While the user sees content quickly, they might not be able to interact with it until the JavaScript has loaded and hydrated.
- **Server-side dependency:** Requires a Node.js server to run the application code, which adds operational complexity compared to serving pure static files.
- **Next.js Bundles:** SSR applications, especially using frameworks like Next.js, still ship substantial JavaScript bundles to the client. While better than a pure SPA, the _total_ amount of data (HTML + JS) can be significant, particularly due to the "hydration" step that requires re-running the same UI logic on the client.

## 4. Isomorphic Rendering & Server Components: The Modern Hybrid (Next.js App Directory)

Isomorphic (or Universal) applications are those where the _same codebase_ can run on both the server and the client, but critically, it can behave _differently_ in each environment. This concept has been refined with **React Server Components (RSC)**, heavily adopted by **Next.js in its "App" directory**.

**How it works:**

- **User navigates to `example.com`:**
  - Browser requests page from server.
  - Server (e.g., Next.js with the App Router) runs React Server Components. These components are rendered _only_ on the server and never send their JavaScript to the client. They produce HTML and metadata.
  - The server streams down the initial HTML. Components wrapped in `Suspense` boundaries can stream their content later, allowing the rest of the page to render quickly with loading states.
  - Client Components (which _do_ send their JS to the client) are identified, their HTML is included, and their corresponding JavaScript is sent down for hydration, similar to traditional SSR.
  - The browser displays the initial HTML and progressively updates as more streamed HTML or hydrated client components become ready.
- **User clicks a link to `example.com/about`:**
  - Instead of a full page reload, the client (using React's router) immediately shows a loading state for the dynamic parts of the new page (thanks to `Suspense`).
  - In parallel, the client makes an API request to the server, asking for the _changed_ parts of the page.
  - The server again renders Server Components for the new route, generates only the necessary HTML chunks (or data for client components), and streams them back.
  - The browser receives these HTML chunks and inserts them, replacing the loading states with actual content.
  - Persistent elements (like a video player) are easily maintained because the browser is not doing a full page navigation.

**Examples:**

- **Next.js (with "App" directory router and Server Components)**, Remix.

**Pros:**

- **Optimal initial load:** Static HTML is delivered fast, and dynamic parts can stream with loading states.
- **Reduced client-side JavaScript:** Server Components mean that logic and data fetching for parts of your UI _never_ leave the server, significantly cutting down JS bundle sizes sent to the client.
- **Immediate navigation experience:** Users see a new loading state instantly upon clicking, and content fills in as it arrives.
- **Improved SEO:** Full content is available in the initial HTML.
- **Enhanced developer experience:** Write components that decide where they run.

**Cons:**

- **Complex infrastructure:** Requires a sophisticated server-side runtime, often requiring platforms like Vercel or Netlify that provide an "Edge Worker" to handle initial static content caching and dynamic content streaming. This can be a barrier for teams managing their own backend infrastructure.
- **Debugging complexity:** Debugging can be more challenging due to code running in different environments.

## 5. MPA-Influenced Split Execution: The "Islands" Architecture

The "Islands" architecture aims to blend the best of both worlds without the full server-side React runtime overhead across the entire application. It leverages the traditional MPA's ability to serve static HTML from a CDN very quickly, while selectively "hydrating" or making interactive only small, isolated parts ("islands") of the page.

**How it works:**

- **User navigates to `amazon.com/cart`:**
  - Browser requests page from server.
  - Server (or a CDN) sends a largely static HTML file. This file contains placeholders (the "islands") for dynamic or interactive components, e.g., a shopping cart widget.
  - Browser immediately displays the static HTML content.
  - A tiny bit of client-side JavaScript (the "island" runtime) embedded in the initial HTML scans the page for these "islands."
  - For each island, this embedded JS makes a _separate_ network request to an API endpoint to fetch the specific HTML or data needed for that island.
  - The server processes this request (e.g., Astro's server runtime), generates only the HTML fragment for that island (potentially fetching user-specific data like cart items), and sends it back.
  - The client-side JavaScript injects this HTML into its placeholder, and if the island is interactive, its minimal JavaScript is loaded and hydrated.

**Example:**

- **Astro**, Marko, Eleventy (with islands).

**Pros:**

- **Extremely fast initial page load:** Pure HTML from a CDN is nearly instantaneous.
- **Minimal JavaScript by default:** Only the JS needed for specific interactive islands is sent, not the entire application's JS. This significantly reduces overall bundle size.
- **Simplified deployment:** The core application can be hosted on a static CDN, with dynamic islands hitting separate API endpoints.
- **Targeted hydration:** Only interactive islands are hydrated, avoiding the "over-hydration" problem of full SSR.

**Cons:**

- **Slight delay for island content:** While the static page loads instantly, the dynamic content within an island won't appear until its specific API request and rendering process is complete.
- **Mental model shift:** Requires thinking about components as distinct, independent units (static vs. dynamic).

## Conclusion: The Blended Future

The journey through web rendering strategies reveals a clear trend: the industry is striving for a harmonious blend of server-side power and client-side fluidity. There is no single "best" strategy; the optimal choice depends on your application's specific needs, budget, and development team's expertise.

- For content-heavy sites needing top-tier SEO and minimal interactivity, **MPA (Flask, Vanilla HTML, HTMX)** still offers compelling simplicity and performance.
- For highly interactive, internal dashboards or complex UIs where initial load isn't paramount, a pure **SPA (React)** can offer a fantastic developer and user experience.
- For most modern web applications, the hybrid approaches of **SSR SPAs (Next.js Pages directory)**, **Isomorphic Rendering with Server Components (Next.js App directory)**, and **Island Architectures (Astro)** offer powerful ways to deliver fast, SEO-friendly, and interactive experiences by intelligently offloading work to the server and minimizing client-side burdens.

The future of web development lies in leveraging these advanced techniques to deliver user experiences that feel instantaneous and responsive, without compromising on efficiency or scalability.
