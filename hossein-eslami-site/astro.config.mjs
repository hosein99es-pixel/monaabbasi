// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypePlaceholders from './src/lib/rehype-placeholders.mjs';
import { SITE_URL } from './src/consts.ts';

export default defineConfig({
  site: SITE_URL,
  integrations: [sitemap()],
  build: { format: 'directory' },
  markdown: { rehypePlugins: [rehypePlaceholders] },
});
