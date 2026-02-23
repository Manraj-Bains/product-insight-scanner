import { useState, useCallback, type ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  panel: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
}

export function Tabs({ items, defaultTab }: TabsProps) {
  const [activeId, setActiveId] = useState(defaultTab ?? items[0]?.id ?? "");

  const activePanel = items.find((t) => t.id === activeId)?.panel ?? null;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = index <= 0 ? items.length - 1 : index - 1;
        setActiveId(items[prev].id);
        const tablist = (e.currentTarget as HTMLButtonElement).closest(
          "[role=tablist]"
        );
        const tabs = tablist?.querySelectorAll<HTMLButtonElement>("[role=tab]");
        tabs?.[prev]?.focus();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const next = index >= items.length - 1 ? 0 : index + 1;
        setActiveId(items[next].id);
        const tablist = (e.currentTarget as HTMLButtonElement).closest(
          "[role=tablist]"
        );
        const tabs = tablist?.querySelectorAll<HTMLButtonElement>("[role=tab]");
        tabs?.[next]?.focus();
      }
    },
    [items]
  );

  return (
    <div>
      <div
        role="tablist"
        aria-label="Product details"
        className="flex gap-0 overflow-x-auto border-b border-gray-200 dark:border-gray-700"
      >
        {items.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            tabIndex={activeId === tab.id ? 0 : -1}
            aria-selected={activeId === tab.id}
            aria-controls="product-details-panel"
            onClick={() => setActiveId(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-inset dark:focus:ring-gray-600 ${
              activeId === tab.id
                ? "border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id="product-details-panel"
        aria-labelledby={`tab-${activeId}`}
        className="p-4 sm:p-5"
      >
        {activePanel}
      </div>
    </div>
  );
}
