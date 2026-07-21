/**
 * Build the "Book Consultation" URL and preserve attribution parameters.
 *
 * The base URL is `PUBLIC_BOOKING_APP_URL`. Any UTM parameters or common
 * click IDs already present on the landing URL are forwarded to the booking
 * app so we don't lose attribution across the redirect.
 */
export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "msclkid",
  "ref",
] as const;

export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];

export function extractAttribution(
  source: URL | URLSearchParams | Record<string, string | undefined> | undefined,
): Record<string, string> {
  if (!source) return {};
  const params: URLSearchParams =
    source instanceof URL
      ? source.searchParams
      : source instanceof URLSearchParams
        ? source
        : new URLSearchParams(
            Object.fromEntries(
              Object.entries(source).filter(
                ([, v]) => typeof v === "string" && v.length > 0,
              ) as [string, string][],
            ),
          );
  const out: Record<string, string> = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key);
    if (value) out[key] = value;
  }
  return out;
}

export function bookingUrl(
  baseUrl: string,
  attribution: Record<string, string> = {},
): string {
  if (!baseUrl) return "#";
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(attribution)) {
    if (v) cleaned[k] = v;
  }
  if (Object.keys(cleaned).length === 0) return baseUrl;

  // Preserve any existing query on the booking base URL (e.g. tenant flag).
  try {
    const url = new URL(baseUrl);
    for (const [k, v] of Object.entries(cleaned)) {
      url.searchParams.set(k, v);
    }
    return url.toString();
  } catch {
    // Not an absolute URL — fall back to simple concatenation.
    const sep = baseUrl.includes("?") ? "&" : "?";
    const qs = new URLSearchParams(cleaned).toString();
    return `${baseUrl}${sep}${qs}`;
  }
}

export type BookingDeepLink = {
  tab: "consultation" | "nidhi" | "scanning";
  doctor: string;
};

/** Map landing practitioner / legacy profile slugs to booking deep-link params. */
export function bookingDeepLinkForSlug(slug: string): BookingDeepLink {
  const s = slug.toLowerCase();
  if (s.includes("gopika") || s.includes("nidhi")) {
    return { tab: "nidhi", doctor: "gopika" };
  }
  if (s.includes("priyanka")) {
    return { tab: "consultation", doctor: "priyanka" };
  }
  if (s.includes("unni")) {
    return { tab: "consultation", doctor: "unnikrishnan" };
  }
  return {
    tab: "consultation",
    doctor: s.replace(/^dr-/, "").replace(/-bhuvanendran$/, ""),
  };
}

/**
 * Booking app login URL with tab/doctor deep link + attribution.
 * Example: https://staging-booking…/login?tab=nidhi&doctor=gopika&utm_source=…
 */
export function bookingLoginUrl(
  baseUrl: string,
  deepLink: BookingDeepLink,
  attribution: Record<string, string> = {},
): string {
  if (!baseUrl) return "#";
  const params: Record<string, string> = {
    tab: deepLink.tab,
    doctor: deepLink.doctor,
  };
  for (const [k, v] of Object.entries(attribution)) {
    if (v && (ATTRIBUTION_KEYS as readonly string[]).includes(k)) params[k] = v;
  }

  try {
    const url = new URL(baseUrl);
    const basePath = url.pathname.replace(/\/?$/, "/");
    url.pathname = `${basePath}login`.replace(/\/{2,}/g, "/");
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    return url.toString();
  } catch {
    const root = baseUrl.replace(/\/?$/, "/");
    const qs = new URLSearchParams(params).toString();
    return `${root}login?${qs}`;
  }
}
