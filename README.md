# Pretheeksha Fertility Centre — Website

Marketing site for [pretheeksha.com](https://pretheeksha.com) — fertility and paediatric care in Kollam, Kerala. Built with [Astro](https://astro.build).

| | |
|---|---|
| **Docs index** | [`docs/README.md`](docs/README.md) |
| **Design brief** | [`docs/DESIGN_DIRECTION.md`](docs/DESIGN_DIRECTION.md) |
| **Design package** | [`@infynox/pretheeksha-design`](https://www.npmjs.com/package/@infynox/pretheeksha-design) |

## Design system (shared with booking)

```css
@import "@infynox/pretheeksha-design/tokens.css";
```

Coolify: **no `GITHUB_TOKEN`** — install from the public npm registry. Brand: forest / honey / cream.

## Tech

- **Astro 5** — static output; tiny inline script for nav + scroll reveals
- Design tokens via `@infynox/pretheeksha-design`; component-scoped styles
- SEO: canonical URL, Open Graph, `MedicalClinic` JSON-LD
- Content from platform API at build time (fail-closed)

## Getting started

```bash
npm install
cp .env.example .env
npm run dev      # http://localhost:4321
npm run build    # outputs to ./dist
npm run preview  # preview the production build
npm run verify   # mock content API + Task 17 acceptance
```

## Environment variables

See `.env.example`. Astro exposes `PUBLIC_*` to the browser; everything else is build/server-only.

| Variable | Scope | Purpose |
|----------|-------|---------|
| `API_BASE_URL` | build | Content API base for build-time fetches. **Required.** |
| `PUBLIC_API_BASE_URL` | browser | Lead form + consent discovery (falls back to `API_BASE_URL`) |
| `PUBLIC_BOOKING_APP_URL` | browser | Book Consultation deep-link base |
| `PUBLIC_LEAD_PURPOSE_CODE` | browser | Consent purpose code (default `marketing`) |
| `PUBLIC_CONTENT_LOCALE` | browser | Locale for consent/SEO (default `en-IN`) |
| `CONTENT_FAIL_CLOSED` | build | Required content failure breaks build (default `true`) |
| `ALLOW_CONTENT_FALLBACK` | build | Local-only: use `fixtures/content-fallback.json` |
| `SITE_URL` | build | Canonical site override (staging) |
| `PUBLIC_ENABLE_BUG_REPORTS` | browser | Show Report Bug chrome |

### Fail-closed policy

Required endpoints (`/content/site-settings`, `/content/practitioners`, `/content/services`, `/content/seo`) must return `2xx` or the build fails. Optional endpoints (`/content/testimonials`, `/content/faqs`) degrade gracefully.

`ALLOW_CONTENT_FALLBACK=true` is **local only** — leave `false` in CI/staging/production.

### Local laptop without API / DB tunnel

1. Start the OCI tunnel + platform API, then `npm run dev`, **or**
2. Set `ALLOW_CONTENT_FALLBACK=true` in `.env` (never in Coolify).

Lead form discovers the current consent notice via `GET /consent/notices/current` at submit time.

## Project structure

```
public/images/                       Brand + photography assets
src/
  layouts/Base.astro                 <head>, fonts, structured data, optional API SEO
  components/Header.astro            Topbar + sticky nav (env-driven Book CTA)
  components/Footer.astro            Footer (env-driven Book CTA)
  components/LeadForm.astro          Consent-aware lead capture
  pages/index.astro                  Home — practitioners/services/testimonials/SEO at build
  pages/practitioners/[slug].astro   Dynamic practitioner pages
  pages/dr-*.astro                   Legacy static profiles (+ redirects)
  lib/env.ts                         Build + public env resolvers
  lib/booking.ts                     Book CTA URL + UTM passthrough
  lib/api/content.ts                 Build-time content client (fail-closed)
  lib/api/consent.ts                 Browser notice discovery + leads
  styles/global.css                  Base styles (imports design tokens)
fixtures/content-fallback.json       Local-only content bundle
scripts/verify-landing.mjs           Task 17 verification
docs/                                Design brief + index
```
