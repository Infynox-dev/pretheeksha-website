#!/usr/bin/env node
/**
 * Task 17 automated verification for the Astro landing site.
 *
 * Spins a local mock of the platform's public content + consent endpoints,
 * runs `astro build` under several failure scenarios, and asserts the fail-
 * closed behaviour + optional-degrade behaviour the plan requires.
 *
 * Scenarios covered:
 *   1. Happy path (mock returns fixtures) — build succeeds, HTML contains a
 *      fixture practitioner name and a fixture service name.
 *   2. Required outage (mock 500s /content/practitioners) with fail-closed —
 *      build fails.
 *   3. Optional outage (mock 500s /content/testimonials only) — build succeeds.
 *   4. Fallback path (mock down, ALLOW_CONTENT_FALLBACK=true) — build succeeds
 *      from fixtures/content-fallback.json.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const distDir = path.join(repoRoot, "dist");

const FIXTURES = {
  siteSettings: {
    settings: {
      clinic_name: "Pretheeksha Fertility Centre",
      phone: "+91 83300 84300",
    },
    updated_at: null,
  },
  practitioners: {
    items: [
      {
        slug: "dr-mock-alpha",
        public_display_name: "Dr Mock Alpha",
        public_credentials: "MBBS, VerifyOnly",
        bio: "Mock practitioner used by scripts/verify-landing.mjs.",
        photo_url: null,
        seo_title: null,
        seo_description: null,
        published_at: null,
      },
      {
        slug: "dr-mock-beta",
        public_display_name: "Dr Mock Beta",
        public_credentials: "MBBS, VerifyOnly",
        bio: "Second mock practitioner.",
        photo_url: null,
        seo_title: null,
        seo_description: null,
        published_at: null,
      },
    ],
  },
  services: {
    items: [
      {
        slug: "verify-service-alpha",
        public_name: "Verify Service Alpha",
        summary: "Fixture service used by scripts/verify-landing.mjs.",
        body_markdown: null,
        seo_title: null,
        seo_description: null,
        published_at: null,
      },
      {
        slug: "verify-service-beta",
        public_name: "Verify Service Beta",
        summary: "Second fixture service.",
        body_markdown: null,
        seo_title: null,
        seo_description: null,
        published_at: null,
      },
    ],
  },
  testimonials: {
    items: [
      {
        id: "11111111-1111-1111-1111-111111111111",
        author_display_name: "Mock Patient",
        body: "A mock testimonial body.",
        locale: "en-IN",
        approved_at: null,
      },
    ],
  },
  faqs: { items: [] },
  seo: {
    route: "/",
    locale: "en-IN",
    title: "Mock SEO Title",
    description: "Mock SEO description.",
    canonical_url: null,
    og_image_url: null,
    robots: null,
  },
  notice: {
    notice_id: "22222222-2222-2222-2222-222222222222",
    purpose_code: "marketing",
    version: "1.0",
    locale: "en-IN",
    title: "Marketing consent",
    body_markdown: "We'll only use your details to reply to your enquiry.",
    published_at: new Date().toISOString(),
  },
};

function log(...args) {
  console.log("[verify]", ...args);
}

function stripPrefix(pathname) {
  // Accept both `/api/v1/foo` and `/foo` mount points.
  return pathname.replace(/^\/api\/v1/, "");
}

function startMock({ failEndpoints = new Set(), stripQuery = true } = {}) {
  const hits = [];
  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const key = stripQuery ? url.pathname : req.url;
    hits.push(url.pathname);
    if (failEndpoints.has(url.pathname) || failEndpoints.has(stripPrefix(url.pathname))) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "mock_failure" }));
      return;
    }

    const p = stripPrefix(url.pathname);
    const send = (payload, status = 200) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(payload));
    };

    if (p === "/content/site-settings") return send(FIXTURES.siteSettings);
    if (p === "/content/practitioners") return send(FIXTURES.practitioners);
    if (p === "/content/services") return send(FIXTURES.services);
    if (p === "/content/testimonials") return send(FIXTURES.testimonials);
    if (p === "/content/faqs") return send(FIXTURES.faqs);
    if (p === "/content/seo") return send(FIXTURES.seo);
    if (p === "/consent/notices/current") return send(FIXTURES.notice);
    if (p.startsWith("/content/practitioners/")) {
      const slug = p.split("/").pop();
      const item = FIXTURES.practitioners.items.find((x) => x.slug === slug);
      if (!item) return send({ error: "not_found" }, 404);
      return send(item);
    }
    return send({ error: "not_found", path: p }, 404);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        port,
        server,
        hits,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

function runBuild(env) {
  return new Promise((resolve) => {
    const child = spawn("npx", ["astro", "build"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        ...env,
        // Prevent Astro telemetry prompts from hanging the build.
        ASTRO_TELEMETRY_DISABLED: "1",
        CI: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

function readBuiltHtml(rel) {
  const p = path.join(distDir, rel);
  assert(existsSync(p), `expected built file ${rel}`);
  return readFileSync(p, "utf8");
}

async function scenarioHappyPath() {
  log("scenario 1: happy path (build succeeds + HTML contains fixtures)");
  const mock = await startMock();
  try {
    const result = await runBuild({
      API_BASE_URL: `http://127.0.0.1:${mock.port}/api/v1`,
      PUBLIC_API_BASE_URL: `http://127.0.0.1:${mock.port}/api/v1`,
      PUBLIC_BOOKING_APP_URL: "http://localhost:3000/",
      CONTENT_FAIL_CLOSED: "true",
      ALLOW_CONTENT_FALLBACK: "false",
    });
    if (result.code !== 0) {
      console.error(result.stdout);
      console.error(result.stderr);
    }
    assert(result.code === 0, "happy-path build should succeed");
    const html = readBuiltHtml("index.html");
    assert(
      html.includes("Dr Mock Alpha"),
      "index.html should contain fixture practitioner name 'Dr Mock Alpha'",
    );
    assert(
      html.includes("Verify Service Alpha"),
      "index.html should contain fixture service name 'Verify Service Alpha'",
    );
    // dynamic practitioner page renders for each fixture slug
    const detail = readBuiltHtml("practitioners/dr-mock-alpha/index.html");
    assert(
      detail.includes("Dr Mock Alpha"),
      "detail page should contain practitioner name",
    );
    log("  PASS");
  } finally {
    await mock.close();
  }
}

async function scenarioRequiredOutageFailsBuild() {
  log("scenario 2: required outage + fail-closed → build fails");
  const mock = await startMock({
    failEndpoints: new Set(["/content/practitioners", "/api/v1/content/practitioners"]),
  });
  try {
    const result = await runBuild({
      API_BASE_URL: `http://127.0.0.1:${mock.port}/api/v1`,
      PUBLIC_API_BASE_URL: `http://127.0.0.1:${mock.port}/api/v1`,
      PUBLIC_BOOKING_APP_URL: "http://localhost:3000/",
      CONTENT_FAIL_CLOSED: "true",
      ALLOW_CONTENT_FALLBACK: "false",
    });
    assert(
      result.code !== 0,
      "build should fail when a required content endpoint returns 500 under fail-closed",
    );
    log("  PASS (exit code:", result.code, ")");
  } finally {
    await mock.close();
  }
}

async function scenarioOptionalOutageSucceeds() {
  log("scenario 3: optional testimonial outage → build still succeeds");
  const mock = await startMock({
    failEndpoints: new Set(["/content/testimonials", "/api/v1/content/testimonials"]),
  });
  try {
    const result = await runBuild({
      API_BASE_URL: `http://127.0.0.1:${mock.port}/api/v1`,
      PUBLIC_API_BASE_URL: `http://127.0.0.1:${mock.port}/api/v1`,
      PUBLIC_BOOKING_APP_URL: "http://localhost:3000/",
      CONTENT_FAIL_CLOSED: "true",
      ALLOW_CONTENT_FALLBACK: "false",
    });
    if (result.code !== 0) {
      console.error(result.stdout);
      console.error(result.stderr);
    }
    assert(result.code === 0, "build should succeed when only optional endpoints fail");
    const html = readBuiltHtml("index.html");
    assert(
      html.includes("Dr Mock Alpha"),
      "index.html should still render practitioners",
    );
    log("  PASS");
  } finally {
    await mock.close();
  }
}

async function scenarioFallbackWithoutApi() {
  log("scenario 4: API completely down + ALLOW_CONTENT_FALLBACK=true → build succeeds from fallback");
  const result = await runBuild({
    // Point at a port with no listener so every fetch fails immediately.
    API_BASE_URL: "http://127.0.0.1:1/api/v1",
    PUBLIC_API_BASE_URL: "http://127.0.0.1:1/api/v1",
    PUBLIC_BOOKING_APP_URL: "http://localhost:3000/",
    CONTENT_FAIL_CLOSED: "true",
    ALLOW_CONTENT_FALLBACK: "true",
  });
  if (result.code !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
  }
  assert(result.code === 0, "fallback build should succeed when API is unreachable");
  const html = readBuiltHtml("index.html");
  assert(
    html.includes("Dr. Unnikrishnan MS"),
    "fallback build should render practitioner from fixtures/content-fallback.json",
  );
  log("  PASS");
}

async function main() {
  const started = Date.now();
  try {
    await scenarioHappyPath();
    await scenarioRequiredOutageFailsBuild();
    await scenarioOptionalOutageSucceeds();
    await scenarioFallbackWithoutApi();
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    log(`ALL SCENARIOS PASSED in ${elapsed}s`);
    process.exit(0);
  } catch (err) {
    console.error("[verify] FAILED:", err.message);
    process.exit(1);
  }
}

main();
