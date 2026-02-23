/** Skeleton rows for name search loading state. */
export function SearchResultsSkeleton() {
  return (
    <ul className="space-y-2" role="list" aria-busy="true">
      {[1, 2, 3, 4].map((i) => (
        <li key={i}>
          <div className="flex animate-pulse items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="h-6 w-14 shrink-0 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </li>
      ))}
    </ul>
  );
}
