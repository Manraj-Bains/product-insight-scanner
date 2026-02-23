import { useState, useMemo } from "react";
import type { NameSearchHit } from "../api/searchProduct";
import { SearchResultsSkeleton } from "./SearchResultsSkeleton";

type SourceFilter = "all" | "food" | "beauty";
type SortBy = "relevance" | "name";

interface ProductSearchResultsProps {
  hits: NameSearchHit[];
  onSelect: (barcode: string) => void;
  loading?: boolean;
}

function sortByRelevance(hits: NameSearchHit[]): NameSearchHit[] {
  return [...hits].sort((a, b) => {
    const aHasImg = a.imageUrl ? 1 : 0;
    const bHasImg = b.imageUrl ? 1 : 0;
    if (bHasImg !== aHasImg) return bHasImg - aHasImg;
    return (a.name || "").localeCompare(b.name || "", undefined, {
      sensitivity: "base",
    });
  });
}

function sortByName(hits: NameSearchHit[]): NameSearchHit[] {
  return [...hits].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
  );
}

export function ProductSearchResults({
  hits,
  onSelect,
  loading,
}: ProductSearchResultsProps) {
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("relevance");

  const filteredAndSorted = useMemo(() => {
    let list = hits;
    if (sourceFilter === "food") list = list.filter((h) => h.source === "food");
    else if (sourceFilter === "beauty")
      list = list.filter((h) => h.source === "beauty");
    return sortBy === "name" ? sortByName(list) : sortByRelevance(list);
  }, [hits, sourceFilter, sortBy]);

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
          Searching food &amp; beauty…
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {(["all", "food", "beauty"] as const).map((f) => (
              <div
                key={f}
                className="h-8 w-14 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800"
                aria-hidden
              />
            ))}
          </div>
        </div>
        <SearchResultsSkeleton />
      </div>
    );
  }

  if (hits.length === 0) {
    return (
      <div className="rounded-2xl bg-white py-10 text-center dark:bg-gray-800/50">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No products found. Try another name or search by barcode.
        </p>
      </div>
    );
  }

  const foodCount = hits.filter((h) => h.source === "food").length;
  const beautyCount = hits.filter((h) => h.source === "beauty").length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {hits.length} result{hits.length !== 1 ? "s" : ""}
          {foodCount > 0 || beautyCount > 0
            ? ` (Food: ${foodCount}, Beauty: ${beautyCount})`
            : ""}
        </p>
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter by source"
        >
          {(["all", "food", "beauty"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setSourceFilter(f)}
              aria-pressed={sourceFilter === f}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                sourceFilter === f
                  ? "bg-emerald-600 text-white dark:bg-emerald-500"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
              }`}
            >
              {f === "all" ? "All" : f === "food" ? "Food" : "Beauty"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            aria-label="Sort results"
          >
            <option value="relevance">Relevance</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
      <ul className="space-y-2" role="list">
        {filteredAndSorted.map((hit) => (
          <li key={hit.barcode}>
            <button
              type="button"
              onClick={() => onSelect(hit.barcode)}
              className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20 dark:focus:ring-emerald-500/30"
            >
              {hit.imageUrl ? (
                <img
                  src={hit.imageUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg object-contain bg-gray-100 dark:bg-gray-700/50"
                />
              ) : (
                <div
                  className="h-14 w-14 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-700/50"
                  aria-hidden
                />
              )}
              <div className="min-w-0 flex-1">
                <span className="block truncate font-medium text-gray-900 dark:text-gray-100">
                  {hit.name}
                </span>
                {hit.brand && (
                  <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                    {hit.brand}
                  </span>
                )}
              </div>
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                  hit.source === "beauty"
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                }`}
              >
                {hit.source === "beauty" ? "Beauty" : "Food"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
