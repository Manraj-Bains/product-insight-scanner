import { useState, useCallback, useEffect, useRef } from "react";
import { useHistory } from "../hooks/useHistory";
import { useFavorites } from "../hooks/useFavorites";
import { useProductSearch } from "../hooks/useProductSearch";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { getProductUrl, getSearchParamsFromUrl, getInitialSearchValueFromUrl } from "../utils/url";
import { computeHealthScore } from "../utils/score";
import { CommandSearch } from "../components/CommandSearch";
import { ProductCard } from "../components/ProductCard";
import { ProductSearchResults } from "../components/ProductSearchResults";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { HistoryList } from "../components/HistoryList";
import { Alert } from "../components/Alert";
import { ConfirmDialog } from "../components/ConfirmDialog";

const HISTORY_KEY = "product-insight-scanner-history";
const FAVORITES_KEY = "product-insight-scanner-favorites";
const HISTORY_MAX = 50;

export type { AppError, ErrorType } from "../hooks/useProductSearch";
export type { FavoriteItem } from "../hooks/useFavorites";

export function Home() {
  const productSectionRef = useRef<HTMLElement | null>(null);
  const productTitleRef = useRef<HTMLHeadingElement | null>(null);
  const errorAlertRef = useRef<HTMLDivElement | null>(null);
  const initialUrlAppliedRef = useRef(false);

  const history = useHistory(HISTORY_KEY, HISTORY_MAX);
  const favorites = useFavorites(FAVORITES_KEY);
  const searchState = useProductSearch();

  const {
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
  } = searchState;

  const applyUrlParams = useCallback(() => {
    const { barcode: b, q } = getSearchParamsFromUrl();
    if (b) {
      search(b);
      return;
    }
    if (q) searchByName(q);
  }, [search, searchByName]);

  useEffect(() => {
    if (initialUrlAppliedRef.current) return;
    initialUrlAppliedRef.current = true;
    applyUrlParams();
  }, [applyUrlParams]);

  useEffect(() => {
    const onPopState = () => applyUrlParams();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [applyUrlParams]);

  const debouncedNameSearch = useDebouncedCallback((query: string) => {
    searchByName(query).catch(() => {
      setTimeout(() => errorAlertRef.current?.focus(), 50);
    });
  }, 400);

  const handleBarcodeSearch = useCallback(
    async (barcode: string) => {
      setError(null);
      try {
        const result = await search(barcode);
        if (result) {
          history.addItem({
            barcode,
            name: result.product.name ?? "Unknown product",
            searchedAt: Date.now(),
            source: result.source,
            imageUrl: result.product.imageUrl,
            brand: result.product.brand,
          });
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", getProductUrl(barcode));
          }
        }
        productSectionRef.current?.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => productTitleRef.current?.focus(), 100);
      } catch {
        setTimeout(() => errorAlertRef.current?.focus(), 50);
      }
    },
    [search, setError, history]
  );

  const handleSearchByName = useCallback(
    async (query: string) => {
      setError(null);
      try {
        await searchByName(query);
      } catch {
        setTimeout(() => errorAlertRef.current?.focus(), 50);
      }
    },
    [searchByName, setError]
  );

  const handleSelectFromNameSearch = useCallback(
    (barcode: string) => {
      setNameSearchResults(null);
      handleBarcodeSearch(barcode);
    },
    [setNameSearchResults, handleBarcodeSearch]
  );

  const healthScore =
    product && productSource === "food" ? computeHealthScore(product) : null;
  const isFavorite = Boolean(
    currentBarcode && favorites.items.some((f) => f.barcode === currentBarcode)
  );

  const [historyFilter, setHistoryFilter] = useState("");
  const [favoritesFilter, setFavoritesFilter] = useState("");
  const [clearHistoryOpen, setClearHistoryOpen] = useState(false);
  const [clearFavoritesOpen, setClearFavoritesOpen] = useState(false);

  const filteredHistory = history.items.filter((item) => {
    if (!historyFilter.trim()) return true;
    const q = historyFilter.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.barcode.includes(historyFilter)
    );
  });

  const filteredFavorites = favorites.items.filter((item) => {
    if (!favoritesFilter.trim()) return true;
    const q = favoritesFilter.toLowerCase();
    const name = (item.name ?? "").toLowerCase();
    const brand = (item.brand ?? "").toLowerCase();
    return (
      name.includes(q) ||
      brand.includes(q) ||
      item.barcode.includes(favoritesFilter)
    );
  });

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950">
      <header className="sticky top-0 z-10 border-b border-gray-200/60 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95">
        <div className="mx-auto max-w-[960px] px-4 py-3 sm:px-6">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-xl">
            Product Insight Scanner
          </h1>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Scan food, drinks, or beauty products
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[960px] px-4 py-6 sm:px-6 lg:flex lg:gap-8">
        <main className="min-w-0 flex-1 space-y-6">
          <section aria-label="Search">
            <CommandSearch
              onBarcodeSearch={handleBarcodeSearch}
              onNameSearch={handleSearchByName}
              onNameQueryChange={debouncedNameSearch}
              disabled={loading}
              initialValue={getInitialSearchValueFromUrl()}
            />
          </section>

          {(nameSearchResults !== null || nameSearchLoading) && (
            <section aria-label="Search results">
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Results
              </h2>
              <ProductSearchResults
                hits={nameSearchResults ?? []}
                onSelect={handleSelectFromNameSearch}
                loading={nameSearchLoading}
              />
            </section>
          )}

          {error && (
            <div ref={errorAlertRef} tabIndex={-1} className="outline-none">
              <Alert id="error-alert" aria-live="assertive">
                {error.message}
              </Alert>
            </div>
          )}

          {loading && !product && (
            <section aria-label="Product result" aria-busy="true">
              <LoadingSkeleton />
            </section>
          )}

          {!loading && !product && !nameSearchLoading && nameSearchResults === null && (
            <section aria-label="Get started" className="rounded-2xl border border-dashed border-gray-200 bg-white/50 py-12 text-center dark:border-gray-700 dark:bg-gray-800/30">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter a barcode (8–14 digits) or product name above to get started.
              </p>
            </section>
          )}

          {product &&
            productSource &&
            currentBarcode &&
            (productSource === "beauty" || healthScore !== null) && (
              <section
                ref={productSectionRef}
                aria-label="Product result"
                id="product-result"
              >
                <ProductCard
                  barcode={currentBarcode}
                  product={product}
                  productSource={productSource}
                  healthScore={healthScore}
                  isFavorite={isFavorite}
                  onToggleFavorite={(barcode) =>
                    favorites.toggle(barcode, {
                      name: product.name,
                      brand: product.brand,
                      imageUrl: product.imageUrl,
                      source: productSource,
                    })
                  }
                  getProductUrl={() => getProductUrl(currentBarcode)}
                  productTitleRef={productTitleRef}
                />
              </section>
            )}
        </main>

        <aside className="mt-8 shrink-0 space-y-4 lg:mt-0 lg:w-72">
          <details className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 [&::-webkit-details-marker]:hidden">
              Scan History
              <span className="ml-2 text-gray-400" aria-hidden>▼</span>
            </summary>
            <div className="border-t border-gray-100 px-4 pb-4 pt-2 dark:border-gray-700/50">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <input
                  type="search"
                  placeholder="Filter"
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  aria-label="Filter history"
                />
                {history.items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setClearHistoryOpen(true)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    aria-label="Clear history"
                  >
                    Clear
                  </button>
                )}
              </div>
              <HistoryList
                items={filteredHistory}
                onSelect={handleBarcodeSearch}
                emptyMessage={
                  historyFilter.trim()
                    ? "No matches."
                    : "No scan history yet. Scan a product to see it here."
                }
              />
            </div>
          </details>

          <details className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 [&::-webkit-details-marker]:hidden">
              Favorites
              <span className="ml-2 text-gray-400" aria-hidden>▼</span>
            </summary>
            <div className="border-t border-gray-100 px-4 pb-4 pt-2 dark:border-gray-700/50">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <input
                  type="search"
                  placeholder="Filter"
                  value={favoritesFilter}
                  onChange={(e) => setFavoritesFilter(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  aria-label="Filter favorites"
                />
                {favorites.items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setClearFavoritesOpen(true)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    aria-label="Clear favorites"
                  >
                    Clear
                  </button>
                )}
              </div>
              {filteredFavorites.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {favoritesFilter.trim()
                    ? "No matches."
                    : "No favorites yet. Star a product to add it."}
                </p>
              ) : (
                <ul className="space-y-1" role="list">
                  {filteredFavorites.map((item) => (
                    <li key={item.barcode}>
                      <button
                        type="button"
                        onClick={() => handleBarcodeSearch(item.barcode)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-inset dark:hover:bg-gray-800/50 dark:focus:ring-amber-500/30"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded object-contain bg-gray-100 dark:bg-gray-700/50"
                          />
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-100 text-amber-500 dark:bg-gray-700/50 dark:text-amber-400">
                            ★
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate font-medium text-gray-900 dark:text-gray-100">
                          {item.name || item.brand || item.barcode}
                        </span>
                        {item.source && (
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              item.source === "beauty"
                                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                            }`}
                          >
                            {item.source === "beauty" ? "Beauty" : "Food"}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        </aside>
      </div>

      <ConfirmDialog
        open={clearHistoryOpen}
        title="Clear scan history?"
        message="This will remove all items from your scan history. This cannot be undone."
        confirmLabel="Clear history"
        variant="danger"
        onConfirm={() => {
          history.clear();
          setClearHistoryOpen(false);
        }}
        onCancel={() => setClearHistoryOpen(false)}
      />
      <ConfirmDialog
        open={clearFavoritesOpen}
        title="Clear all favorites?"
        message="This will remove all products from your favorites. This cannot be undone."
        confirmLabel="Clear favorites"
        variant="danger"
        onConfirm={() => {
          favorites.clear();
          setClearFavoritesOpen(false);
        }}
        onCancel={() => setClearFavoritesOpen(false)}
      />
    </div>
  );
}

