interface FavoriteButtonProps {
  barcode: string;
  isFavorite: boolean;
  onToggle: (barcode: string) => void;
  label?: string;
}

export function FavoriteButton({
  barcode,
  isFavorite,
  onToggle,
  label = "Favorite",
}: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(barcode)}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
    >
      <span
        className={`text-base leading-none transition-colors ${isFavorite ? "text-amber-500" : "text-gray-400 dark:text-gray-500"}`}
        aria-hidden
      >
        {isFavorite ? "★" : "☆"}
      </span>
      {label}
    </button>
  );
}
