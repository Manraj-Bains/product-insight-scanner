/**
 * Open Food Facts API client and types.
 * Uses v0 API (stable).
 * https://world.openfoodfacts.org/api/v0/product/{barcode}.json
 */

import { safeFetchJson, FetchError } from "./safeFetch";

export interface Nutriments {
  "energy-kcal_100g"?: number;
  fat_100g?: number;
  "saturated-fat_100g"?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  fiber_100g?: number;
  proteins_100g?: number;
  salt_100g?: number;
}

export interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  image_front_url?: string;
  nutriscore_grade?: string;
  nutrition_grades?: string;
  ingredients_text?: string;
  ingredients?: Array<{ id?: string; text?: string }>;
  allergens?: string;
  allergens_tags?: string[];
  nutriments?: Nutriments;
  additives_n?: number;
}

export interface OpenFoodFactsResponse {
  status: number;
  status_verbose?: string;
  code?: string;
  product?: OpenFoodFactsProduct;
}

const API_BASE = "https://world.openfoodfacts.org/api/v0";
const USER_AGENT =
  "ProductInsightScanner/1.0 (https://github.com/product-insight-scanner)";

/** EAN/UPC: typically 8, 12, 13, or 14 digits */
const BARCODE_REGEX = /^\d{8,14}$/;

export function isValidBarcode(barcode: string): boolean {
  const trimmed = barcode.trim();
  return trimmed.length > 0 && BARCODE_REGEX.test(trimmed);
}

export interface FetchProductOptions {
  signal?: AbortSignal | null;
  timeoutMs?: number;
}

export async function fetchProductByBarcode(
  barcode: string,
  options: FetchProductOptions = {}
): Promise<OpenFoodFactsResponse> {
  const trimmed = barcode.trim();
  if (!isValidBarcode(trimmed)) {
    throw new Error("Invalid barcode format. Use 8–14 digits (EAN/UPC).");
  }

  const url = `${API_BASE}/product/${trimmed}.json`;
  let data: OpenFoodFactsResponse;
  try {
    data = await safeFetchJson<OpenFoodFactsResponse>(url, {
      signal: options.signal ?? null,
      timeoutMs: options.timeoutMs ?? 15_000,
      headers: { "User-Agent": USER_AGENT },
    });
  } catch (e) {
    if (e instanceof FetchError && e.status === 404) {
      throw new Error("Product not found for this barcode.");
    }
    if (e instanceof FetchError) {
      throw new Error(e.message);
    }
    throw e;
  }

  if (data.status === 0 || !data.product) {
    throw new Error("Product not found for this barcode.");
  }

  return data;
}

/** Search by product name (full-text). Rate-limited. */
export interface FoodSearchHit {
  code: string;
  product_name?: string;
  brands?: string;
  image_front_url?: string;
}

export interface FoodSearchResponse {
  count: number;
  products: FoodSearchHit[];
}

const SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";

export interface SearchFoodOptions {
  signal?: AbortSignal | null;
  timeoutMs?: number;
}

export async function searchFoodByName(
  query: string,
  pageSize = 12,
  searchOptions: SearchFoodOptions = {}
): Promise<FoodSearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { count: 0, products: [] };
  }
  const params = new URLSearchParams({
    search_terms: trimmed,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: String(pageSize),
  });
  const url = `${SEARCH_URL}?${params}`;
  try {
    const data = await safeFetchJson<{ products?: unknown[]; count?: number }>(
      url,
      {
        signal: searchOptions.signal ?? null,
        timeoutMs: searchOptions.timeoutMs ?? 15_000,
        headers: { "User-Agent": USER_AGENT },
      }
    );
    const rawProducts = (data.products ?? []) as Array<{
    code?: string;
    product_name?: string;
    brands?: string;
    image_front_url?: string;
  }>;
  const products: FoodSearchHit[] = rawProducts
      .filter((p): p is typeof p & { code: string } => Boolean(p?.code))
      .map((p) => ({
          code: p.code,
          product_name: p.product_name,
          brands: p.brands,
          image_front_url: p.image_front_url,
        })
      );
    return { count: data.count ?? 0, products };
  } catch (e) {
    if (e instanceof FetchError) {
      throw new Error(
        e.code === "timeout"
          ? "Search timed out. Try again."
          : e.status === 429
            ? "Too many searches. Try again in a minute."
            : `Search failed: ${e.message}`
      );
    }
    throw e;
  }
}
