/**
 * In-memory session cache for API results.
 * Reduces duplicate calls; cache is lost on page unload.
 */

export type ProductSource = "food" | "beauty";

export interface CachedBarcodeResult {
  product: unknown;
  source: ProductSource;
}

const barcodeCache = new Map<string, CachedBarcodeResult>();
const nameSearchCache = new Map<string, { hits: unknown[] }>();

const MAX_BARCODE_ENTRIES = 100;
const MAX_NAME_ENTRIES = 50;

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

export function getCachedBarcode(barcode: string): CachedBarcodeResult | null {
  const key = barcode.trim();
  return barcodeCache.get(key) ?? null;
}

export function setCachedBarcode(
  barcode: string,
  product: unknown,
  source: ProductSource
): void {
  const key = barcode.trim();
  if (barcodeCache.size >= MAX_BARCODE_ENTRIES) {
    const firstKey = barcodeCache.keys().next().value;
    if (firstKey !== undefined) barcodeCache.delete(firstKey);
  }
  barcodeCache.set(key, { product, source });
}

export function getCachedNameSearch(query: string): unknown[] | null {
  const key = normalizeQuery(query);
  const entry = nameSearchCache.get(key);
  return entry?.hits ?? null;
}

export function setCachedNameSearch(query: string, hits: unknown[]): void {
  const key = normalizeQuery(query);
  if (nameSearchCache.size >= MAX_NAME_ENTRIES) {
    const firstKey = nameSearchCache.keys().next().value;
    if (firstKey !== undefined) nameSearchCache.delete(firstKey);
  }
  nameSearchCache.set(key, { hits });
}
