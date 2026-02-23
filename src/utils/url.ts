/**
 * URL helpers for deep linking (barcode and search query).
 */

export function getProductUrl(barcode: string): string {
  const base =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "";
  return `${base}?barcode=${encodeURIComponent(barcode)}`;
}

export function getSearchParamsFromUrl(): { barcode: string | null; q: string | null } {
  if (typeof window === "undefined") {
    return { barcode: null, q: null };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    barcode: params.get("barcode")?.trim() ?? null,
    q: params.get("q")?.trim() ?? null,
  };
}

/** Initial value for the unified search input from URL (barcode or q). */
export function getInitialSearchValueFromUrl(): string {
  const { barcode, q } = getSearchParamsFromUrl();
  return barcode ?? q ?? "";
}
