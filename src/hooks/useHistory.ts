import { useState, useEffect, useCallback } from "react";
import type { HistoryItem } from "../components/HistoryList";

const DEFAULT_MAX = 50;

export function useHistory(
  key: string,
  maxItems: number = DEFAULT_MAX
): {
  items: HistoryItem[];
  setItems: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  addItem: (item: Omit<HistoryItem, "searchedAt"> & { searchedAt?: number }) => void;
  clear: () => void;
} {
  const [items, setItems] = useState<HistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as HistoryItem[];
      return Array.isArray(parsed) ? parsed.slice(0, maxItems) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(items.slice(0, maxItems)));
    } catch {
      // ignore
    }
  }, [key, items, maxItems]);

  const addItem = useCallback(
    (item: Omit<HistoryItem, "searchedAt"> & { searchedAt?: number }) => {
      const full: HistoryItem = {
        ...item,
        searchedAt: item.searchedAt ?? Date.now(),
      };
      setItems((prev) => [
        full,
        ...prev.filter((h) => h.barcode !== full.barcode),
      ].slice(0, maxItems));
    },
    [maxItems]
  );

  const clear = useCallback(() => setItems([]), []);

  return { items, setItems, addItem, clear };
}
