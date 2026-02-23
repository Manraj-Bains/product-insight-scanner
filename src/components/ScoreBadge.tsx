import { getScoreBand, type ScoreBand } from "../utils/score";

const BAND_STYLES: Record<ScoreBand, string> = {
  Excellent:
    "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  Good: "bg-lime-50 text-lime-800 dark:bg-lime-950/40 dark:text-lime-200",
  Okay: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  Poor: "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200",
};

interface ScoreBadgeProps {
  score: number;
  variant?: "circular" | "meter";
  showLabel?: boolean;
}

export function ScoreBadge({
  score,
  variant = "circular",
  showLabel = true,
}: ScoreBadgeProps) {
  const band = getScoreBand(score);
  const styles = BAND_STYLES[band];
  const label = band;

  if (variant === "meter") {
    const pct = Math.max(0, Math.min(100, score));
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`rounded-lg px-2 py-1 text-sm font-medium ${styles}`}
          >
            {score}/100
          </span>
          {showLabel && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {label}
            </span>
          )}
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Health score ${score} out of 100: ${label}`}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${
              band === "Excellent"
                ? "bg-emerald-500"
                : band === "Good"
                  ? "bg-lime-500"
                  : band === "Okay"
                    ? "bg-amber-500"
                    : "bg-red-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] ${styles}`}
      aria-label={`Health score ${score} out of 100: ${label}`}
    >
      <span className="text-xl font-semibold sm:text-2xl">{score}</span>
      <span className="text-[10px] font-medium opacity-80">/100</span>
      {showLabel && (
        <span className="mt-0.5 text-[10px] font-medium opacity-80">
          {label}
        </span>
      )}
    </div>
  );
}
