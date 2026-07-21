// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build
export default defineConfig({
  // Override at Docker/Coolify build time via SITE_URL (e.g. staging hostname).
  site: process.env.SITE_URL || 'https://pretheeksha.com',
  compressHTML: true,
  // CMS `/practitioners/{slug}` → rich static profiles (avoid thin/homepage shell).
  redirects: {
    '/practitioners/dr-unnikrishnan': '/dr-unnikrishnan',
    '/practitioners/dr-unnikrishnan/': '/dr-unnikrishnan',
    '/practitioners/unnikrishnan': '/dr-unnikrishnan',
    '/practitioners/unnikrishnan/': '/dr-unnikrishnan',
    '/practitioners/dr-priyanka-bhuvanendran': '/dr-priyanka',
    '/practitioners/dr-priyanka-bhuvanendran/': '/dr-priyanka',
    '/practitioners/dr-priyanka': '/dr-priyanka',
    '/practitioners/dr-priyanka/': '/dr-priyanka',
    '/practitioners/priyanka': '/dr-priyanka',
    '/practitioners/priyanka/': '/dr-priyanka',
    '/practitioners/dr-gopika': '/dr-gopika',
    '/practitioners/dr-gopika/': '/dr-gopika',
    '/practitioners/dr-gopika-nair': '/dr-gopika',
    '/practitioners/dr-gopika-nair/': '/dr-gopika',
    '/practitioners/gopika': '/dr-gopika',
    '/practitioners/gopika/': '/dr-gopika',
  },
  vite: {
    // Default Astro envPrefix is only PUBLIC_. Expose build-time content API
    // + fail-closed flags too (all non-secret / public content URLs).
    envPrefix: ['PUBLIC_', 'API_', 'CONTENT_', 'ALLOW_'],
  },
});
