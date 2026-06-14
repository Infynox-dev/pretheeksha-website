# Pretheeksha Fertility Centre — Website Redesign

A complete, top-to-bottom redesign of [pretheeksha.com](https://pretheeksha.com) — a fertility and paediatric care centre in Kollam, Kerala. Rebuilt as a fast, accessible, single-page experience with [Astro](https://astro.build).

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
npm run dev      # http://localhost:4321
npm run build    # outputs to ./dist
npm run preview  # preview the production build
```

## Project structure

```
public/images/        Brand + photography assets
src/
  layouts/Base.astro      <head>, fonts, structured data, global scripts
  components/Header.astro  Topbar + sticky nav + mobile drawer
  components/Footer.astro  Footer
  pages/index.astro        All page sections + scoped styles
  styles/global.css        Design tokens + base styles
```

## Notes for the client

- **Imagery** — the doctor portraits and logo are the official assets from pretheeksha.com. Hero/lifestyle photographs are tasteful royalty-free stand-ins (Unsplash) and should be swapped for the clinic's own photography before launch.
- **Testimonials** — the patient quotes are representative placeholders (paraphrased in the spirit of the original Malayalam reviews). Replace with approved, consented patient stories.
- **Contact form** — currently uses a `mailto:` fallback. Wire it to a backend / form service (e.g. a serverless endpoint or form provider) for production.
- **App store links** — placeholders (`#`); point them to the live Play Store / App Store listings.
