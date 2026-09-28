// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Netlify sets URL to the site's main address during the build; the fallback is only for local builds.
const site = process.env.URL || 'https://hoseineslami.netlify.app';

export default defineConfig({
  site,
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  build: { format: 'directory' },
});
