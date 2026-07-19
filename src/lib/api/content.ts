/**
 * Build-time content client for the Pretheeksha public content API.
 *
 * Every request runs in the Node build process — never in the browser — so
 * we use `API_BASE_URL` (not `PUBLIC_API_BASE_URL`). Required endpoints
 * fail closed by default so a missing or broken content service can never
 * silently ship an empty page. `ALLOW_CONTENT_FALLBACK=true` is a local-only
 * escape hatch that reads `fixtures/content-fallback.json` instead.
 */
import fs from "node:fs";
import path from "node:path";

import { getBuildEnv } from "../env.ts";

export interface Practitioner {
  slug: string;
  public_display_name: string;
  public_credentials: string | null;
  bio: string | null;
  photo_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
}

export interface Service {
  slug: string;
  public_name: string;
  summary: string | null;
  body_markdown: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
}

export interface Testimonial {
  id: string;
  author_display_name: string;
  body: string;
  locale: string;
  approved_at: string | null;
}

export interface Faq {
  id: string;
  question: string;
  answer_markdown: string;
  locale: string;
  sort_order: number;
}

export interface SiteSettings {
  settings: Record<string, unknown>;
  updated_at: string | null;
}

export interface SeoMeta {
  route?: string;
  locale?: string;
  title: string;
  description: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
  robots: string | null;
}

export interface ContentBundle {
  siteSettings: SiteSettings | null;
  practitioners: Practitioner[];
  services: Service[];
  testimonials: Testimonial[];
  faqs: Faq[];
  seoByRoute: Record<string, SeoMeta>;
  source: "api" | "fallback";
}

const FALLBACK_FIXTURE = path.join(process.cwd(), "fixtures/content-fallback.json");

class ContentFetchError extends Error {
  constructor(
    message: string,
    public readonly endpoint: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ContentFetchError";
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { accept: "application/json" },
    });
  } catch (err) {
    throw new ContentFetchError(
      `Network error fetching ${url}: ${(err as Error).message}`,
      url,
    );
  }
  if (!response.ok) {
    throw new ContentFetchError(
      `Content API returned ${response.status} for ${url}`,
      url,
      response.status,
    );
  }
  return (await response.json()) as T;
}

function loadFallback(): ContentBundle {
  const raw = fs.readFileSync(FALLBACK_FIXTURE, "utf8");
  const parsed = JSON.parse(raw) as Omit<ContentBundle, "source">;
  return { ...parsed, source: "fallback" };
}

interface RequiredRoutes {
  routes: string[];
}

/**
 * Build a full content bundle for the landing site.
 *
 * Required endpoints (build fails without them unless fallback is on):
 *  - GET /content/site-settings
 *  - GET /content/practitioners
 *  - GET /content/services
 *  - GET /content/seo?route=<r>&locale=<l>  (per route)
 *
 * Optional endpoints (degrade gracefully to empty):
 *  - GET /content/testimonials
 *  - GET /content/faqs
 */
export async function loadContentBundle(
  opts: RequiredRoutes = { routes: ["/"] },
): Promise<ContentBundle> {
  const env = getBuildEnv();
  const base = env.API_BASE_URL;

  try {
    const [siteSettings, practitionersRes, servicesRes] = await Promise.all([
      fetchJson<SiteSettings>(`${base}/content/site-settings`),
      fetchJson<{ items: Practitioner[] }>(`${base}/content/practitioners`),
      fetchJson<{ items: Service[] }>(`${base}/content/services`),
    ]);

    const seoByRoute: Record<string, SeoMeta> = {};
    for (const route of opts.routes) {
      const q = new URLSearchParams({ route, locale: env.CONTENT_LOCALE }).toString();
      try {
        seoByRoute[route] = await fetchJson<SeoMeta>(`${base}/content/seo?${q}`);
      } catch (err) {
        if (err instanceof ContentFetchError && err.status === 404) {
          // Missing per-route SEO is not fatal — the layout has sensible defaults.
          continue;
        }
        throw err;
      }
    }

    let testimonials: Testimonial[] = [];
    try {
      const res = await fetchJson<{ items: Testimonial[] }>(
        `${base}/content/testimonials`,
      );
      testimonials = res.items;
    } catch (err) {
      console.warn(
        `[content] optional /content/testimonials failed (${(err as Error).message}); rendering without stories.`,
      );
    }

    let faqs: Faq[] = [];
    try {
      const res = await fetchJson<{ items: Faq[] }>(`${base}/content/faqs`);
      faqs = res.items;
    } catch (err) {
      console.warn(
        `[content] optional /content/faqs failed (${(err as Error).message}); rendering without faqs.`,
      );
    }

    return {
      siteSettings,
      practitioners: practitionersRes.items,
      services: servicesRes.items,
      testimonials,
      faqs,
      seoByRoute,
      source: "api",
    };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    if (env.ALLOW_CONTENT_FALLBACK) {
      console.warn(
        `[content] required fetch failed (${detail}); using fixtures/content-fallback.json (ALLOW_CONTENT_FALLBACK=true).`,
      );
      return loadFallback();
    }
    // Fail closed. CONTENT_FAIL_CLOSED defaults to true; even when a dev
    // disables it we still throw because there is no meaningful degraded state.
    throw new Error(
      `[content] required content fetch failed and no fallback is enabled: ${detail}`,
    );
  }
}

export { ContentFetchError };
