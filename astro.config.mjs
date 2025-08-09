// @ts-nocheck
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  // Enable server output so API routes run on Vercel serverless
  output: "server",
  vite: {
    plugins: [tailwindcss()],
  },

  site: 'https://blog.tashif.codes/',
  adapter: vercel(),
  integrations: [react(), mdx(), sitemap()]
});