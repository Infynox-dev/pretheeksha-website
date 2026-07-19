/**
 * Resolve environment variables used by the landing site.
 *
 * `getBuildEnv()` is called from Astro `.astro` frontmatter (Node process at
 * build time) and reads `API_BASE_URL` + the fail-closed / fallback flags.
 * `getPublicEnv()` returns only the PUBLIC_* values that are safe to inline
 * into shipped browser JS.
 */
const src: Record<string, string | undefined> =
  typeof process !== "undefined" && process.env ? process.env : {};

function bool(value: string | undefined, fallback = false): boolean {
  if (value == null || value === "") return fallback;
  return /^(1|true|yes|on)$/i.test(value.trim());
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export interface BuildEnv {
  API_BASE_URL: string;
  CONTENT_FAIL_CLOSED: boolean;
  ALLOW_CONTENT_FALLBACK: boolean;
  LEAD_PURPOSE_CODE: string;
  CONTENT_LOCALE: string;
}

export interface PublicEnv {
  PUBLIC_API_BASE_URL: string;
  PUBLIC_BOOKING_APP_URL: string;
  PUBLIC_LEAD_PURPOSE_CODE: string;
  PUBLIC_CONTENT_LOCALE: string;
}

export function getBuildEnv(): BuildEnv {
  const apiBase = src.API_BASE_URL;
  if (!apiBase) {
    throw new Error(
      "Missing required env: API_BASE_URL (see .env.example). " +
        "Set it to your platform's public content API base, e.g. " +
        "http://127.0.0.1:8000/api/v1",
    );
  }
  return {
    API_BASE_URL: trimSlash(apiBase),
    CONTENT_FAIL_CLOSED: bool(src.CONTENT_FAIL_CLOSED, true),
    ALLOW_CONTENT_FALLBACK: bool(src.ALLOW_CONTENT_FALLBACK, false),
    LEAD_PURPOSE_CODE:
      src.PUBLIC_LEAD_PURPOSE_CODE || src.LEAD_PURPOSE_CODE || "marketing",
    CONTENT_LOCALE: src.PUBLIC_CONTENT_LOCALE || src.CONTENT_LOCALE || "en-IN",
  };
}

export function getPublicEnv(): PublicEnv {
  const publicApi =
    src.PUBLIC_API_BASE_URL || (src.API_BASE_URL ?? "");
  return {
    PUBLIC_API_BASE_URL: trimSlash(publicApi),
    PUBLIC_BOOKING_APP_URL: src.PUBLIC_BOOKING_APP_URL || "http://localhost:3000/",
    PUBLIC_LEAD_PURPOSE_CODE:
      src.PUBLIC_LEAD_PURPOSE_CODE || src.LEAD_PURPOSE_CODE || "marketing",
    PUBLIC_CONTENT_LOCALE: src.PUBLIC_CONTENT_LOCALE || src.CONTENT_LOCALE || "en-IN",
  };
}
