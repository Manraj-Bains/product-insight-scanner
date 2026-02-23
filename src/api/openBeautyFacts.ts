/**
 * Open Beauty Facts API – shampoo, soap, cosmetics, etc.
 * Same response shape as Open Food Facts.
 * https://world.openbeautyfacts.org/api/v0/product/{barcode}.json
 */

import type {
  OpenFoodFactsProduct,
  OpenFoodFactsResponse,
} from "./openFoodFacts";
import { isValidBarcode } from "./openFoodFacts";
import { safeFetchJson, FetchError } from "./safeFetch";

const API_BASE = "https://world.openbeautyfacts.org/api/v0";
const USER_AGENT =
  "ProductInsightScanner/1.0 (https://github.com/product-insight-scanner)";

export type OpenBeautyFactsProduct = OpenFoodFactsProduct;
export type OpenBeautyFactsResponse = OpenFoodFactsResponse;

export interface FetchProductOptions {
  signal?: AbortSignal | null;
  timeoutMs?: number;
}

export async function fetchBeautyProductByBarcode(
  barcode: string,
  options: FetchProductOptions = {}
): Promise<OpenBeautyFactsResponse> {
  const trimmed = barcode.trim();
  if (!isValidBarcode(trimmed)) {
    throw new Error("Invalid barcode format. Use 8–14 digits (EAN/UPC).");
  }

  const url = `${API_BASE}/product/${trimmed}.json`;
  let data: OpenBeautyFactsResponse;
  try {
    data = await safeFetchJson<OpenBeautyFactsResponse>(url, {
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

export interface BeautySearchHit {
  code: string;
  product_name?: string;
  brands?: string;
  image_front_url?: string;
}

export interface BeautySearchResponse {
  count: number;
  products: BeautySearchHit[];
}

const BEAUTY_SEARCH_URL = "https://world.openbeautyfacts.org/cgi/search.pl";

export interface SearchBeautyOptions {
  signal?: AbortSignal | null;
  timeoutMs?: number;
}

export async function searchBeautyByName(
  query: string,
  pageSize = 8,
  searchOptions: SearchBeautyOptions = {}
): Promise<BeautySearchResponse> {
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
  const url = `${BEAUTY_SEARCH_URL}?${params}`;
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
  const products: BeautySearchHit[] = rawProducts
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
