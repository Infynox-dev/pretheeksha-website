/**
 * ponytail: booking login deep-link helpers (mirrors src/lib/booking.ts).
 * Run: node scripts/check-booking-deeplink.mjs
 */
import assert from "node:assert/strict";

const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "msclkid",
  "ref",
];

function bookingDeepLinkForSlug(slug) {
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

function bookingLoginUrl(baseUrl, deepLink, attribution = {}) {
  if (!baseUrl) return "#";
  const params = { tab: deepLink.tab, doctor: deepLink.doctor };
  for (const [k, v] of Object.entries(attribution)) {
    if (v && ATTRIBUTION_KEYS.includes(k)) params[k] = v;
  }
  const url = new URL(baseUrl);
  const basePath = url.pathname.replace(/\/?$/, "/");
  url.pathname = `${basePath}login`.replace(/\/{2,}/g, "/");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

assert.deepEqual(bookingDeepLinkForSlug("gopika"), {
  tab: "nidhi",
  doctor: "gopika",
});
assert.deepEqual(bookingDeepLinkForSlug("dr-priyanka"), {
  tab: "consultation",
  doctor: "priyanka",
});

const url = bookingLoginUrl(
  "https://staging-booking.pretheeksha.com/",
  { tab: "nidhi", doctor: "gopika" },
  { utm_source: "landing" },
);
assert.match(url, /\/login\?/);
assert.match(url, /tab=nidhi/);
assert.match(url, /doctor=gopika/);
assert.match(url, /utm_source=landing/);
assert.doesNotMatch(url, /localhost/);

console.log("check-booking-deeplink: ok");
