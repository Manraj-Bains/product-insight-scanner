import { useState, useCallback, useRef } from "react";
import {
  searchProductByBarcode,
  searchProductsByName,
  type ProductSource,
  type NameSearchHit,
  type NormalizedProduct,
} from "../api/searchProduct";

export type ErrorType =
  | "invalid_barcode"
  | "not_found"
  | "network"
  | "search"
  | "unknown";

export interface AppError {
  type: ErrorType;
  message: string;
}

function parseError(e: unknown): AppError {
  const msg = e instanceof Error ? e.message : "Something went wrong.";
  if (msg.includes("Invalid barcode") || msg.includes("8–14 digits"))
    return { type: "invalid_barcode", message: msg };
  if (msg.includes("Product not found") || msg.includes("not found"))
    return { type: "not_found", message: msg };
  if (msg.includes("Network error")) return { type: "network", message: msg };
  if (msg.includes("Search failed")) return { type: "search", message: msg };
  if (msg.includes("Too many requests")) return { type: "network", message: msg };
  if (msg.includes("cancelled") || msg.includes("timed out"))
    return { type: "network", message: msg };
  return { type: "unknown", message: msg };
}

export function useProductSearch(): {
  loading: boolean;
  error: AppError | null;
  product: NormalizedProduct | null;
  productSource: ProductSource | null;
  currentBarcode: string | null;
  nameSearchResults: NameSearchHit[] | null;
  nameSearchLoading: boolean;
  setError: (e: AppError | null) => void;
  setNameSearchResults: (r: NameSearchHit[] | null) => void;
  search: (barcode: string) => Promise<{ product: NormalizedProduct; source: ProductSource } | null>;
  searchByName: (query: string) => Promise<void>;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [product, setProduct] = useState<NormalizedProduct | null>(null);
  const [productSource, setProductSource] = useState<ProductSource | null>(null);
  const [currentBarcode, setCurrentBarcode] = useState<string | null>(null);
  const [nameSearchResults, setNameSearchResults] = useState<NameSearchHit[] | null>(null);
  const [nameSearchLoading, setNameSearchLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (barcode: string): Promise<{ product: NormalizedProduct; source: ProductSource } | null> => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      setError(null);
      setNameSearchResults(null);
      setLoading(true);

      try {
        const result = await searchProductByBarcode(barcode, { signal });
        if (signal.aborted) return null;
        setProduct(result.product);
        setProductSource(result.source);
        setCurrentBarcode(barcode);
        setLoading(false);
        return { product: result.product, source: result.source };
      } catch (e) {
        if (signal.aborted) return null;
        setError(parseError(e));
        setLoading(false);
        throw e;
      }
    },
    []
  );

  const searchByName = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setNameSearchResults([]);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setError(null);
    setNameSearchLoading(true);
    setNameSearchResults(null);

    try {
      const hits = await searchProductsByName(trimmed, { signal });
      if (signal.aborted) return;
      setNameSearchResults(hits);
    } catch (e) {
      if (signal.aborted) return;
      setError({ ...parseError(e), type: "search" });
      throw e;
    } finally {
      if (!signal.aborted) setNameSearchLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    product,
    productSource,
    currentBarcode,
    nameSearchResults,
    nameSearchLoading,
    setError,
    setNameSearchResults,
    search,
    searchByName,
  };
}
