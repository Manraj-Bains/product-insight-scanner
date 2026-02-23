import { formatRelativeTime, formatExactTime } from "../utils/format";

export type ProductSource = "food" | "beauty";

export interface HistoryItem {
  barcode: string;
  name: string;
  searchedAt: number;
  source?: ProductSource;
  imageUrl?: string;
  brand?: string;
}

interface HistoryListProps {
  items: HistoryItem[];
  onSelect: (barcode: string) => void;
  emptyMessage?: string;
}

export function HistoryList({
  items,
  onSelect,
  emptyMessage = "No scan history yet.",
}: HistoryListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-gray-50/80 py-8 text-center text-sm text-gray-500 dark:bg-gray-800/30 dark:text-gray-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-1" role="list">
      {items.map((item) => (
        <li key={item.barcode}>
          <button
            type="button"
            onClick={() => onSelect(item.barcode)}
            title={formatExactTime(item.searchedAt)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:hover:bg-gray-800/50 dark:focus:ring-emerald-500/30"
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="h-8 w-8 shrink-0 rounded object-contain bg-gray-100 dark:bg-gray-700/50"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-100 text-gray-400 dark:bg-gray-700/50 dark:text-gray-500">
                —
              </span>
            )}
            <div className="min-w-0 flex-1">
              <span className="block truncate font-medium text-gray-900 dark:text-gray-100">
                {item.name || "Unknown product"}
              </span>
              {item.brand && (
                <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                  {item.brand}
                </span>
              )}
            </div>
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
            <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500" title={formatExactTime(item.searchedAt)}>
              {formatRelativeTime(item.searchedAt)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
