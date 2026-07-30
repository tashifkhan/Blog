// @ts-nocheck
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  // Enable server output so API routes run on Vercel serverless
  output: "server",
  vite: {
    plugins: [tailwindcss()],
  },
  // Disable image optimization for Vercel serverless compatibility
  image: {
    service: {
      entrypoint: 'astro/assets/services/noop'
    }
  },
  site: 'https://blog.tashif.codes/',
  adapter: vercel({
    functionPerRoute: false
  }),
  // Posts are plain Markdown rendered by packages/markdown; the MDX integration
  // was compiling every post to a component that nothing rendered.
  integrations: [react(), sitemap()]
});