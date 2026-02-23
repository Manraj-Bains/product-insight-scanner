import { useState, useEffect, useCallback } from "react";
import type { ProductSource } from "../api/searchProduct";

export interface FavoriteItem {
  barcode: string;
  name?: string;
  brand?: string;
  imageUrl?: string;
  source?: ProductSource;
}

function parseFavorites(raw: string | null): FavoriteItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item: unknown) => {
        if (typeof item === "string") return { barcode: item };
        if (item && typeof item === "object" && "barcode" in item) {
          const o = item as Record<string, unknown>;
          return {
            barcode: String(o.barcode),
            name: o.name != null ? String(o.name) : undefined,
            brand: o.brand != null ? String(o.brand) : undefined,
            imageUrl: o.imageUrl != null ? String(o.imageUrl) : undefined,
            source:
              o.source === "food" || o.source === "beauty" ? o.source : undefined,
          };
        }
        return null;
      })
      .filter(Boolean) as FavoriteItem[];
  } catch {
    return [];
  }
}

export function useFavorites(key: string): {
  items: FavoriteItem[];
  setItems: React.Dispatch<React.SetStateAction<FavoriteItem[]>>;
  toggle: (
    barcode: string,
    currentProduct: { name?: string; brand?: string; imageUrl?: string; source?: ProductSource } | null
  ) => void;
  clear: () => void;
} {
  const [items, setItems] = useState<FavoriteItem[]>(() =>
    parseFavorites(typeof localStorage !== "undefined" ? localStorage.getItem(key) : null)
  );

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [key, items]);

  const toggle = useCallback(
    (
      barcode: string,
      currentProduct: {
        name?: string;
        brand?: string;
        imageUrl?: string;
        source?: ProductSource;
      } | null
    ) => {
      const isFav = items.some((f) => f.barcode === barcode);
      if (isFav) {
        setItems((prev) => prev.filter((f) => f.barcode !== barcode));
        return;
      }
      setItems((prev) => [
        ...prev.filter((f) => f.barcode !== barcode),
        currentProduct
          ? {
              barcode,
              name: currentProduct.name,
              brand: currentProduct.brand,
              imageUrl: currentProduct.imageUrl,
              source: currentProduct.source,
            }
          : { barcode },
      ]);
    },
    [items]
  );

  const clear = useCallback(() => setItems([]), []);

  return { items, setItems, toggle, clear };
}
