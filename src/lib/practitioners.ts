/**
 * Map CMS practitioner slugs/names onto the rich static /dr-* profiles.
 * Dynamic `/practitioners/{slug}` pages redirect here so we never ship a
 * thin homepage-shell stand-in for the three clinic doctors.
 */
export function legacyDoctorPathFor(
  slug: string,
  displayName = "",
): string | null {
  const s = (slug || "").toLowerCase();
  const n = (displayName || "").toLowerCase();
  if (s.includes("gopika") || n.includes("gopika")) return "/dr-gopika";
  if (s.includes("priyanka") || n.includes("priyanka")) return "/dr-priyanka";
  if (s.includes("unnikrishnan") || n.includes("unnikrishnan")) {
    return "/dr-unnikrishnan";
  }
  return null;
}
