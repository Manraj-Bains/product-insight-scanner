export function LoadingSkeleton() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-800"
      aria-hidden
    >
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:gap-8">
        <div className="h-40 w-full shrink-0 rounded-xl bg-gray-100 dark:bg-gray-700/50 sm:h-44 sm:w-44" />
        <div className="min-w-0 flex-1 space-y-4">
          <div className="h-7 w-4/5 rounded-md bg-gray-100 dark:bg-gray-700/50" />
          <div className="h-4 w-1/3 rounded-md bg-gray-100 dark:bg-gray-700/50" />
          <div className="h-4 w-24 rounded-md bg-gray-100 dark:bg-gray-700/50" />
          <div className="flex flex-wrap gap-2 pt-2">
            <div className="h-9 w-24 rounded-lg bg-gray-100 dark:bg-gray-700/50" />
            <div className="h-9 w-20 rounded-lg bg-gray-100 dark:bg-gray-700/50" />
          </div>
        </div>
      </div>
      <div className="flex gap-1 border-t border-gray-100 px-4 pb-4 pt-3 dark:border-gray-700/50">
        <div className="h-9 w-20 rounded-lg bg-gray-100 dark:bg-gray-700/50" />
        <div className="h-9 w-24 rounded-lg bg-gray-100 dark:bg-gray-700/50" />
        <div className="h-9 w-20 rounded-lg bg-gray-100 dark:bg-gray-700/50" />
      </div>
    </div>
  );
}
