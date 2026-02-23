/**
 * Unified product search: barcode (Food then Beauty) and name search.
 * Uses session cache and AbortController for race-free requests.
 */

import type { OpenFoodFactsProduct } from "./openFoodFacts";
import { fetchProductByBarcode, searchFoodByName } from "./openFoodFacts";
import {
  fetchBeautyProductByBarcode,
  searchBeautyByName,
} from "./openBeautyFacts";
import { normalizeProduct } from "./normalizeProduct";
import {
  getCachedBarcode,
  setCachedBarcode,
  getCachedNameSearch,
  setCachedNameSearch,
} from "./sessionCache";

export type ProductSource = "food" | "beauty";

export type { NormalizedProduct } from "./normalizeProduct";

export interface SearchResult {
  product: import("./normalizeProduct").NormalizedProduct;
  source: ProductSource;
}

export async function searchProductByBarcode(
  barcode: string,
  options: { signal?: AbortSignal | null } = {}
): Promise<SearchResult> {
  const trimmed = barcode.trim();
  const cached = getCachedBarcode(trimmed);
  if (cached) {
    return {
      product: normalizeProduct(cached.product as OpenFoodFactsProduct),
      source: cached.source,
    };
  }

  try {
    const res = await fetchProductByBarcode(trimmed, {
      signal: options.signal ?? null,
    });
    const product = res.product!;
    setCachedBarcode(trimmed, product, "food");
    return {
      product: normalizeProduct(product),
      source: "food",
    };
  } catch {
    const res = await fetchBeautyProductByBarcode(trimmed, {
      signal: options.signal ?? null,
    });
    const product = res.product!;
    setCachedBarcode(trimmed, product, "beauty");
    return {
      product: normalizeProduct(product),
      source: "beauty",
    };
  }
}

/** One product row from name search (food or beauty). */
export interface NameSearchHit {
  barcode: string;
  name: string;
  brand: string;
  imageUrl?: string;
  source: ProductSource;
}

/** Search by product name in both Food and Beauty. */
export async function searchProductsByName(
  query: string,
  options: { signal?: AbortSignal | null } = {}
): Promise<NameSearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cached = getCachedNameSearch(trimmed);
  if (cached) {
    return cached as NameSearchHit[];
  }

  const signal = options.signal ?? null;
  const [foodRes, beautyRes] = await Promise.all([
    searchFoodByName(trimmed, 10, { signal, timeoutMs: 15_000 }),
    searchBeautyByName(trimmed, 6, { signal, timeoutMs: 15_000 }),
  ]);

  const food: NameSearchHit[] = foodRes.products.map((p) => ({
    barcode: p.code,
    name: p.product_name?.trim() || "Unknown product",
    brand: p.brands?.trim() ?? "",
    imageUrl: p.image_front_url?.trim() || undefined,
    source: "food" as const,
  }));
  const beauty: NameSearchHit[] = beautyRes.products.map((p) => ({
    barcode: p.code,
    name: p.product_name?.trim() || "Unknown product",
    brand: p.brands?.trim() ?? "",
    imageUrl: p.image_front_url?.trim() || undefined,
    source: "beauty" as const,
  }));

  const hits = [...food, ...beauty];
  setCachedNameSearch(trimmed, hits);
  return hits;
}
