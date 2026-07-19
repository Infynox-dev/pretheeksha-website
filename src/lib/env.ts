/**
 * Resolve environment variables used by the landing site.
 *
 * `getBuildEnv()` is called from Astro `.astro` frontmatter (Node/Vite at
 * build or SSR time) and reads `API_BASE_URL` + the fail-closed / fallback flags.
 * `getPublicEnv()` returns only the PUBLIC_* values that are safe to inline
 * into shipped browser JS.
 *
 * Astro/Vite exposes `.env` on `import.meta.env` — property access must be
 * static (`import.meta.env.API_BASE_URL`) so Vite can load the key. The verify
 * script also injects the same keys via `process.env` when spawning builds.
 */

function fromProcess(key: string): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  const value = process.env[key];
  return value != null && value !== "" ? value : undefined;
}

function pick(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (value != null && value !== "") return value;
  }
  return undefined;
}

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
  // Static import.meta.env.* reads — required for Vite/Astro .env loading.
  // PUBLIC_API_BASE_URL is an acceptable fallback (same public content base).
  const apiBase = pick(
    import.meta.env.API_BASE_URL,
    fromProcess("API_BASE_URL"),
    import.meta.env.PUBLIC_API_BASE_URL,
    fromProcess("PUBLIC_API_BASE_URL"),
  );
  if (!apiBase) {
    throw new Error(
      "Missing required env: API_BASE_URL (see .env.example). " +
        "Set it to your platform's public content API base, e.g. " +
        "http://127.0.0.1:8000/api/v1",
    );
  }
  return {
    API_BASE_URL: trimSlash(apiBase),
    CONTENT_FAIL_CLOSED: bool(
      pick(
        import.meta.env.CONTENT_FAIL_CLOSED,
        fromProcess("CONTENT_FAIL_CLOSED"),
      ),
      true,
    ),
    ALLOW_CONTENT_FALLBACK: bool(
      pick(
        import.meta.env.ALLOW_CONTENT_FALLBACK,
        fromProcess("ALLOW_CONTENT_FALLBACK"),
      ),
      false,
    ),
    LEAD_PURPOSE_CODE:
      pick(
        import.meta.env.PUBLIC_LEAD_PURPOSE_CODE,
        fromProcess("PUBLIC_LEAD_PURPOSE_CODE"),
        import.meta.env.LEAD_PURPOSE_CODE,
        fromProcess("LEAD_PURPOSE_CODE"),
      ) || "marketing",
    CONTENT_LOCALE:
      pick(
        import.meta.env.PUBLIC_CONTENT_LOCALE,
        fromProcess("PUBLIC_CONTENT_LOCALE"),
        import.meta.env.CONTENT_LOCALE,
        fromProcess("CONTENT_LOCALE"),
      ) || "en-IN",
  };
}

export function getPublicEnv(): PublicEnv {
  const publicApi =
    pick(
      import.meta.env.PUBLIC_API_BASE_URL,
      fromProcess("PUBLIC_API_BASE_URL"),
      import.meta.env.API_BASE_URL,
      fromProcess("API_BASE_URL"),
    ) || "";
  return {
    PUBLIC_API_BASE_URL: trimSlash(publicApi),
    PUBLIC_BOOKING_APP_URL:
      pick(
        import.meta.env.PUBLIC_BOOKING_APP_URL,
        fromProcess("PUBLIC_BOOKING_APP_URL"),
      ) || "http://localhost:3000/",
    PUBLIC_LEAD_PURPOSE_CODE:
      pick(
        import.meta.env.PUBLIC_LEAD_PURPOSE_CODE,
        fromProcess("PUBLIC_LEAD_PURPOSE_CODE"),
        import.meta.env.LEAD_PURPOSE_CODE,
        fromProcess("LEAD_PURPOSE_CODE"),
      ) || "marketing",
    PUBLIC_CONTENT_LOCALE:
      pick(
        import.meta.env.PUBLIC_CONTENT_LOCALE,
        fromProcess("PUBLIC_CONTENT_LOCALE"),
        import.meta.env.CONTENT_LOCALE,
        fromProcess("CONTENT_LOCALE"),
      ) || "en-IN",
  };
}
