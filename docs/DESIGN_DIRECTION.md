# Landing design direction

Project brief for the Pretheeksha marketing site redesign. Day-to-day setup lives in [`../README.md`](../README.md).

## Aesthetic

The redesign moves away from the older "clinical" look toward a **warm, human-centred, nature-grounded** aesthetic.

- **Palette** — deep botanical green (`--forest`) grounded by warm cream/paper backgrounds, honey-gold accent, soft sage / blush supporting tones.
- **Typography** — **Fraunces** (display serif) + **Hanken Grotesk** (body sans).
- **Motion** — staggered hero reveal, scroll-triggered reveals (`IntersectionObserver`), tactile hovers; respects `prefers-reduced-motion`.
- **Atmosphere** — layered radial gradient meshes, soft organic glows, rounded forms, soft shadows.

Shared tokens: [`@infynox/pretheeksha-design`](https://www.npmjs.com/package/@infynox/pretheeksha-design) — see [`DESIGN.md`](https://github.com/Infynox-dev/pretheeksha-design/blob/main/DESIGN.md).

## Sections

1. **Header** — slim contact topbar + sticky blur-backed nav; mobile drawer
2. **Hero** — "Hope finds a home here", full-bleed imagery, dual CTAs, trust bullets
3. **Promise strip** — four brand commitments on the deep-green band
4. **About / Your Parenthood Awaits** — layered imagery, checklist, app-download
5. **Our Commitment** — four value cards
6. **Treatments** — fertility services
7. **Meet Our Team** — practitioners from content API
8. **Nidhi · Paediatric Care**
9. **Voices of Delight** — testimonials
10. **App band** — download CTA
11. **Contact** — lead form + clinic details
12. **Footer**

## Client notes

- **Imagery** — doctor portraits/logo are official; hero/lifestyle photos are Unsplash stand-ins until clinic photography lands.
- **Testimonials** — from `/content/testimonials`; add via platform content flow.
- **Contact form** — `/content/leads` with consent notice discovery (no `mailto:`).
- **App store links** — placeholders (`#`) until live listings exist.
