# Pretheeksha Fertility Centre — Website Redesign

A complete, top-to-bottom redesign of [pretheeksha.com](https://pretheeksha.com) — a fertility and paediatric care centre in Kollam, Kerala. Rebuilt as a fast, accessible, single-page experience with [Astro](https://astro.build).

## Design system (shared with booking)

**Package:** `@infynox/pretheeksha-design` → `github:Infynox-dev/pretheeksha-design#v1.0.0`  
**Contract:** [`DESIGN.md`](https://github.com/Infynox-dev/pretheeksha-design/blob/main/DESIGN.md)

```css
@import "@infynox/pretheeksha-design/tokens.css";
```

When published to npmjs (`npm i @infynox/pretheeksha-design`), Coolify needs no GitHub token. Until then, use the git pin above.

### Coolify — secret while installing from private GitHub

| Build arg / secret | Value |
|--------------------|--------|
| `GITHUB_TOKEN` | PAT with **Contents: Read** on `Infynox-dev/pretheeksha-design` (owner **Infynox-dev** or any collaborator with access) |

Landing and booking share one brand: forest / honey / cream. Follow `DESIGN.md`.

## Design direction

The redesign moves away from the older "clinical" look toward the **warm, human-centred, nature-grounded** aesthetic that defines award-winning healthcare design in 2026. The brief: meet patients at a vulnerable, hopeful moment with calm and trust.

- **Aesthetic** — organic botanical warmth, editorial luxury. Calm, hopeful, premium without feeling sterile.
- **Palette** — deep botanical green (`--forest`) grounded by warm cream/paper backgrounds, a honey-gold accent, and soft sage / blush supporting tones. Warm neutrals reduce visual fatigue and feel human.
- **Typography** — **Fraunces** (a characterful optical display serif) paired with **Hanken Grotesk** (a clean, humanist body sans). Distinctive, not generic.
- **Motion** — a staggered hero reveal on load, gentle scroll-triggered reveals (`IntersectionObserver`), and tactile hover states. All motion respects `prefers-reduced-motion`.
- **Atmosphere** — layered radial gradient meshes, soft organic "blob" glows, rounded forms, and depth via soft shadows rather than flat blocks.

These choices are grounded in current healthcare/fertility web-design research: warmth over clinical coldness, nature-inspired palettes, empathetic copy led by the patient's emotional journey, prominent trust signals (doctor profiles, patient stories), and low-pressure conversion paths.

## Sections

1. **Header** — slim contact topbar + sticky, blur-backed nav that condenses on scroll; full mobile drawer.
2. **Hero** — "Hope finds a home here", warm full-bleed imagery, dual CTAs, trust bullets.
3. **Promise strip** — four brand commitments on the deep-green band.
4. **About / Your Parenthood Awaits** — layered imagery, checklist, app-download.
5. **Our Commitment** — four value cards (Path to Parenthood, Miracle Happens, Life Goals, Dream It).
6. **Treatments** — fertility services (Evaluation, IUI, IVF, ICSI, Preservation, Online Consultation).
7. **Meet Our Team** — Dr. Unnikrishnan MS & Dr. Priyanka Bhuvanendran.
8. **Nidhi · Paediatric Care** — Dr. Gopika Nair.
9. **Voices of Delight** — patient testimonials.
10. **App band** — download call-to-action.
11. **Contact** — empathetic, low-pressure consultation form + clinic details.
12. **Footer** — navigation, contact, social links.

## Tech

- **Astro 5** — static output, zero JS shipped except a tiny inline script for the nav + scroll reveals.
- Custom CSS design system (`src/styles/global.css`) with design tokens; component-scoped styles.
- SEO: canonical URL, Open Graph tags, and `MedicalClinic` JSON-LD structured data.

## Getting started

```bash
npm install
cp .env.example .env
npm run dev      # http://localhost:4321
npm run build    # outputs to ./dist
npm run preview  # preview the production build
npm run verify   # spins a mock content API + asserts Task 17 acceptance
```

## Environment variables

Configured in `.env` (see `.env.example`). Astro exposes any `PUBLIC_*` var
to shipped browser JS; everything else is server/build-time only.

| Variable | Scope | Purpose |
|----------|-------|---------|
| `API_BASE_URL` | build | Public content API base used by build-time fetches (e.g. `http://127.0.0.1:8000/api/v1`). **Required.** |
| `PUBLIC_API_BASE_URL` | browser | API base used by the lead form + consent discovery in the browser. Falls back to `API_BASE_URL` if unset. |
| `PUBLIC_BOOKING_APP_URL` | browser | Base URL of the booking app that "Book Consultation" CTAs deep-link into. |
| `PUBLIC_LEAD_PURPOSE_CODE` | browser | Consent purpose code the lead form binds to. Default: `marketing`. |
| `PUBLIC_CONTENT_LOCALE` | browser | Locale used for consent notice discovery + SEO fetches. Default: `en-IN`. |
| `CONTENT_FAIL_CLOSED` | build | When `true` (default), any required content endpoint failure breaks the build. **Never disable in CI/production.** |
| `ALLOW_CONTENT_FALLBACK` | build | Local-only escape hatch. When `true`, a required content fetch failure falls back to `fixtures/content-fallback.json` instead of failing the build. |
| `SITE_URL` | build | Overrides `astro.config.mjs` `site` for canonical URLs (used in staging). |

### Fail-closed policy

Required endpoints (`/content/site-settings`, `/content/practitioners`,
`/content/services`, `/content/seo`) MUST return `2xx` or the build fails.
This is deliberate: shipping a landing page with silently-missing sections is
worse than shipping no build at all. Optional endpoints
(`/content/testimonials`, `/content/faqs`) degrade gracefully — those
sections just omit content.

The one exception is `ALLOW_CONTENT_FALLBACK=true`, which loads
`fixtures/content-fallback.json`. Use it for local dev only; leave it `false`
in CI, staging, and production.

### Local laptop without API / DB tunnel

Homepage content is fetched at build/dev time from the platform API. If Postgres
is only reachable via the OCI SSH tunnel (`localhost:5433`) and that tunnel (or
`uv run pretheeksha-api`) is down, Astro fails closed with a 500 / build error.

**Options (local only):**

1. Start the tunnel + API, then `npm run dev`.
2. Or set `ALLOW_CONTENT_FALLBACK=true` in `.env` so the site serves
   `fixtures/content-fallback.json` instead of crashing. Never enable this in
   staging/production Coolify build args.

The lead form never embeds a seeded consent notice UUID. Instead, it
discovers the current published notice at submit time via
`GET /consent/notices/current?purpose=<code>&locale=<locale>` and submits
the lead bound to that notice id.

## Project structure

```
public/images/                       Brand + photography assets
src/
  layouts/Base.astro                 <head>, fonts, structured data, optional API SEO
  components/Header.astro            Topbar + sticky nav (env-driven Book CTA)
  components/Footer.astro            Footer (env-driven Book CTA)
  components/LeadForm.astro          Consent-aware lead capture (notice discovery + POST)
  pages/index.astro                  Home page — fetches practitioners/services/testimonials/SEO at build
  pages/practitioners/[slug].astro   Dynamic practitioner pages from /content/practitioners
  pages/dr-unnikrishnan.astro        Rich static legacy profile (kept as fallback)
  lib/env.ts                         Build + public env resolvers
  lib/booking.ts                     Book CTA URL + UTM passthrough helper
  lib/api/content.ts                 Build-time content client (fail-closed)
  lib/api/consent.ts                 Browser-side notice discovery + lead submission
  styles/global.css                  Design tokens + base styles
fixtures/content-fallback.json       Local-only content bundle used when ALLOW_CONTENT_FALLBACK=true
scripts/verify-landing.mjs           Task 17 automated verification (mock API + astro build)
```

## Notes for the client

- **Imagery** — the doctor portraits and logo are the official assets from pretheeksha.com. Hero/lifestyle photographs are tasteful royalty-free stand-ins (Unsplash) and should be swapped for the clinic's own photography before launch.
- **Testimonials** — patient quotes are now sourced from `/content/testimonials`. Add approved, consented patient stories through the platform's content admin flow.
- **Contact form** — wired to the Pretheeksha platform's `/content/leads` endpoint with consent notice discovery. No `mailto:` fallback.
- **App store links** — placeholders (`#`); point them to the live Play Store / App Store listings.
