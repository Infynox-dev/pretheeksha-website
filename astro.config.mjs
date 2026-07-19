// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build
export default defineConfig({
  // Override at Docker/Coolify build time via SITE_URL (e.g. staging hostname).
  site: process.env.SITE_URL || 'https://pretheeksha.com',
  compressHTML: true,
});
