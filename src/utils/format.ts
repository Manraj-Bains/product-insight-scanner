/**
 * Formatting helpers for display and accessibility.
 */

/** Human-readable relative time (e.g. "2h ago", "3d ago"). */
export function formatRelativeTime(ms: number): string {
  const now = Date.now();
  const diff = now - ms;
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if (day >= 1) return `${day}d ago`;
  if (hour >= 1) return `${hour}h ago`;
  if (min >= 1) return `${min}m ago`;
  if (sec >= 10) return `${sec}s ago`;
  return "Just now";
}

/** Full date/time for tooltip. */
export function formatExactTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Normalize allergen tag to human-readable (remove en:, title-case). */
export function formatAllergenTag(tag: string): string {
  return tag
    .replace(/^en:/i, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Format allergens string or tags array for display. */
export function formatAllergens(
  allergens?: string | null,
  allergensTags?: string[] | null
): string {
  if (allergens?.trim()) return allergens.trim();
  if (allergensTags?.length) {
    return allergensTags.map(formatAllergenTag).join(", ");
  }
  return "Not available";
}

/** Safe nutrient value for table: show number + unit or "—". */
export function formatNutrient(
  value: number | undefined | null,
  unit?: string
): string {
  if (value == null || typeof value !== "number" || !Number.isFinite(value))
    return "—";
  const u = unit ?? "";
  return `${Number(value)}${
    u ? (u === "g" || u === "kcal" ? ` ${u}` : u) : ""
  }`;
}
