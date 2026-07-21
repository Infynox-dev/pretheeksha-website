/**
 * ponytail: assert legacy doctor slug mapping + redirect table stay aligned.
 * Run: node scripts/check-practitioner-redirect.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function legacyDoctorPathFor(slug, displayName = "") {
  const s = (slug || "").toLowerCase();
  const n = (displayName || "").toLowerCase();
  if (s.includes("gopika") || n.includes("gopika")) return "/dr-gopika";
  if (s.includes("priyanka") || n.includes("priyanka")) return "/dr-priyanka";
  if (s.includes("unnikrishnan") || n.includes("unnikrishnan")) {
    return "/dr-unnikrishnan";
  }
  return null;
}

assert.equal(legacyDoctorPathFor("dr-gopika"), "/dr-gopika");
assert.equal(legacyDoctorPathFor("gopika"), "/dr-gopika");
assert.equal(
  legacyDoctorPathFor("x", "Dr. Priyanka Bhuvanendran"),
  "/dr-priyanka",
);
assert.equal(legacyDoctorPathFor("dr-unnikrishnan"), "/dr-unnikrishnan");
assert.equal(legacyDoctorPathFor("visiting-consultant"), null);

const cfg = readFileSync(join(root, "astro.config.mjs"), "utf8");
for (const path of [
  "/practitioners/dr-gopika",
  "/practitioners/dr-priyanka-bhuvanendran",
  "/practitioners/dr-unnikrishnan",
]) {
  assert.match(cfg, new RegExp(path.replace(/\//g, "\\/")));
}

console.log("check-practitioner-redirect: ok");
