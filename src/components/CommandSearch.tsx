import { useState, useCallback, useEffect, type FormEvent } from "react";
import { isValidBarcode } from "../api/openFoodFacts";

export type SearchMode = "auto" | "barcode" | "name";

interface CommandSearchProps {
  onBarcodeSearch: (barcode: string) => void;
  onNameSearch: (query: string) => void;
  /** Debounced name search (e.g. while typing). Called when value looks like name query. */
  onNameQueryChange?: (query: string) => void;
  disabled?: boolean;
  initialValue?: string;
}

function looksLikeBarcode(value: string): boolean {
  const trimmed = value.trim();
  return /^\d{8,14}$/.test(trimmed);
}

export function CommandSearch({
  onBarcodeSearch,
  onNameSearch,
  onNameQueryChange,
  disabled,
  initialValue = "",
}: CommandSearchProps) {
  const [value, setValue] = useState(initialValue);
  const [mode, setMode] = useState<SearchMode>("auto");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const trimmed = value.trim();
  useEffect(() => {
    if (trimmed.length < 2) return;
    const isNameQuery = mode === "name" || (mode === "auto" && !looksLikeBarcode(trimmed));
    if (isNameQuery) onNameQueryChange?.(trimmed);
  }, [trimmed, mode, onNameQueryChange]);

  const effectiveMode: "barcode" | "name" =
    mode === "barcode"
      ? "barcode"
      : mode === "name"
        ? "name"
        : looksLikeBarcode(trimmed)
          ? "barcode"
          : "name";

  const wouldBarcode = effectiveMode === "barcode";
  const barcodeValid = !trimmed || isValidBarcode(trimmed);
  const showBarcodeError =
    submitAttempted && trimmed.length > 0 && wouldBarcode && !barcodeValid;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    setSubmitAttempted(true);
    if (wouldBarcode) {
      if (!isValidBarcode(trimmed)) return;
      onBarcodeSearch(trimmed);
    } else {
      onNameSearch(trimmed);
    }
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData("text").trim();
      if (/^\d{8,14}$/.test(pasted)) {
        e.preventDefault();
        setValue(pasted);
        setTimeout(() => onBarcodeSearch(pasted), 0);
      }
    },
    [onBarcodeSearch]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="command-search" className="sr-only">
            Scan or search products
          </label>
          <input
            id="command-search"
            type="text"
            inputMode={mode === "barcode" ? "numeric" : "text"}
            placeholder="Scan or search products (barcode or name)"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (submitAttempted) setSubmitAttempted(false);
            }}
            onPaste={handlePaste}
            disabled={disabled}
            className={`w-full rounded-xl border bg-white py-2.5 pl-4 pr-10 text-sm text-gray-900 placeholder-gray-400 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 ${
              showBarcodeError
                ? "border-red-300 dark:border-red-700"
                : "border-gray-200 focus:border-emerald-500 dark:border-gray-700"
            }`}
            aria-describedby={showBarcodeError ? "command-search-error" : "command-search-hint"}
            aria-invalid={showBarcodeError}
          />
          {value && (
            <button
              type="button"
              onClick={() => setValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear"
            >
              <span aria-hidden>×</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800">
          {(["auto", "barcode", "name"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset ${
                mode === m
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {m === "auto" ? "Auto" : m === "barcode" ? "Barcode" : "Name"}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={disabled || !trimmed || (wouldBarcode && !barcodeValid)}
          className="shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-900"
        >
          Search
        </button>
      </div>
      <p id="command-search-hint" className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
        {mode === "auto"
          ? "Enter 8–14 digits for barcode, or any text for name search."
          : mode === "barcode"
            ? "Enter 8–14 digit EAN/UPC barcode."
            : "Search by product name."}
      </p>
      {showBarcodeError && (
        <p
          id="command-search-error"
          className="mt-1 text-xs text-red-600 dark:text-red-400"
          role="status"
        >
          Use 8–14 digits only (EAN/UPC).
        </p>
      )}
    </form>
  );
}
