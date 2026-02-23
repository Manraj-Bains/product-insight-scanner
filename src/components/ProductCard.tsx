import { useState } from "react";
import type { NormalizedProduct } from "../api/normalizeProduct";
import type { ProductSource } from "../api/searchProduct";
import type { HealthScoreResult } from "../utils/score";
import { formatNutrient } from "../utils/format";
import { Tabs, type TabItem } from "./Tabs";
import { FavoriteButton } from "./FavoriteButton";
import { ScoreBadge } from "./ScoreBadge";

interface ProductCardProps {
  barcode: string;
  product: NormalizedProduct;
  productSource: ProductSource;
  healthScore: HealthScoreResult | null;
  isFavorite: boolean;
  onToggleFavorite: (barcode: string) => void;
  getProductUrl?: () => string;
  productTitleRef?: React.RefObject<HTMLHeadingElement | null>;
}

const NA = "Not available";

const NUTRI_SCORE_COLORS: Record<string, string> = {
  A: "#038141",
  B: "#85BB2F",
  C: "#FECB02",
  D: "#EE8100",
  E: "#E63E11",
};

function hasAnyNutriments(n: NormalizedProduct["nutriments"]): boolean {
  const vals = [
    n.energyKcal100g,
    n.fat100g,
    n.carbohydrates100g,
    n.proteins100g,
    n.salt100g,
  ];
  return vals.some((v) => v != null && Number.isFinite(v));
}

export function ProductCard({
  barcode,
  product,
  productSource,
  healthScore,
  isFavorite,
  onToggleFavorite,
  getProductUrl,
  productTitleRef,
}: ProductCardProps) {
  const [breakdownExpanded, setBreakdownExpanded] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const name = product.name || NA;
  const brand = product.brand || NA;
  const imageUrl = product.imageUrl;
  const isBeauty = productSource === "beauty";
  const grade = isBeauty ? null : product.nutriscoreGrade;
  const breakdown = healthScore?.breakdown ?? [];
  const topBreakdown = breakdown.slice(0, 3);
  const restBreakdown = breakdown.slice(3);
  const nutriments = product.nutriments;
  const showNutrition = !isBeauty && hasAnyNutriments(nutriments);
  const allergensDisplay =
    product.allergensDisplay?.trim() || NA;
  const hasAllergens =
    allergensDisplay !== NA && allergensDisplay.trim().length > 0;

  const handleCopyLink = () => {
    const url = getProductUrl?.() ?? window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2500);
    });
  };

  const overviewPanel = (
    <div className="space-y-4">
      {isBeauty ? (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Beauty products don’t include Nutri-Score or nutrition data. Check
            ingredients and allergens in the tabs below.
          </p>
          <div>
            <h4 className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              Ingredients
            </h4>
            <p className="max-w-[65ch] text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {product.ingredientsText ||
                (product.ingredients.length > 0
                  ? product.ingredients
                      .map((i) => i.text)
                      .filter(Boolean)
                      .slice(0, 6)
                      .join(", ") +
                    (product.ingredients.length > 6 ? "…" : "")
                  : "Not specified.")}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4">
            {healthScore != null && (
              <ScoreBadge score={healthScore.score} variant="circular" showLabel />
            )}
            {grade ? (
              <span
                className="rounded-lg px-2.5 py-1 text-sm font-semibold text-white"
                style={{
                  backgroundColor: NUTRI_SCORE_COLORS[grade] ?? "#6b7280",
                }}
              >
                Nutri-Score {grade}
              </span>
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Nutri-Score not available
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Base 70, then adjusted by Nutri-Score, additives, sugar, saturated
            fat, salt, and fiber (per 100g).
          </p>
          {breakdown.length > 0 && (
            <div className="rounded-xl bg-gray-50/80 py-3 dark:bg-gray-800/30">
              <h4 className="mb-2 px-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                Score breakdown
              </h4>
              <ul className="space-y-1 px-4 text-sm">
                {(breakdownExpanded ? breakdown : topBreakdown).map((item, i) => (
                  <li
                    key={i}
                    className="flex justify-between gap-4 border-b border-gray-100 last:border-0 dark:border-gray-700/50"
                  >
                    <span className="text-gray-600 dark:text-gray-400">
                      {item.label}: {item.reason}
                    </span>
                    <span
                      className={
                        item.delta >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {item.delta >= 0 ? "+" : ""}
                      {item.delta}
                    </span>
                  </li>
                ))}
              </ul>
              {restBreakdown.length > 0 && !breakdownExpanded && (
                <button
                  type="button"
                  onClick={() => setBreakdownExpanded(true)}
                  className="mt-2 px-4 text-sm font-medium text-gray-600 hover:underline dark:text-gray-400"
                >
                  Show all
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  const hasIngredientsArray = product.ingredients.length > 0;
  const ingredientsList = product.ingredients;
  const ingredientsTextFallback = product.ingredientsText || NA;

  const ingredientsPanel = (
    <div className="max-w-[65ch]">
      {hasIngredientsArray && ingredientsList.length > 0 ? (
        <ul className="space-y-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {ingredientsList.map((item, i) => (
            <li key={i} className="flex justify-between gap-4">
              <span>{item.text || "—"}</span>
              {item.percent != null && (
                <span className="shrink-0 text-gray-500 dark:text-gray-400">
                  {item.percent}%
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {ingredientsTextFallback}
        </p>
      )}
    </div>
  );

  const nutritionRows = [
    { label: "Energy", value: nutriments.energyKcal100g, unit: "kcal" as const },
    { label: "Fat", value: nutriments.fat100g, unit: "g" as const },
    { label: "Saturated fat", value: nutriments.saturatedFat100g, unit: "g" as const },
    { label: "Carbohydrates", value: nutriments.carbohydrates100g, unit: "g" as const },
    { label: "Sugars", value: nutriments.sugars100g, unit: "g" as const },
    { label: "Fiber", value: nutriments.fiber100g, unit: "g" as const },
    { label: "Proteins", value: nutriments.proteins100g, unit: "g" as const },
    { label: "Salt", value: nutriments.salt100g, unit: "g" as const },
  ];

  const nutritionPanel = showNutrition ? (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Per 100g/ml (from Open Food Facts).
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[260px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 pr-4 font-medium text-gray-700 dark:text-gray-300">
                Nutrient
              </th>
              <th className="py-2 font-medium text-gray-700 dark:text-gray-300">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {nutritionRows.map((row) => (
              <tr
                key={row.label}
                className="border-b border-gray-100 dark:border-gray-700/50"
              >
                <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">
                  {row.label}
                </td>
                <td className="py-2 text-gray-900 dark:text-gray-100">
                  {formatNutrient(row.value, row.unit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ) : (
    <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
      {isBeauty
        ? "Nutrition data is for food products only."
        : "No nutrition data available for this product."}
    </p>
  );

  const allergensPanel = hasAllergens ? (
    <p className="max-w-[65ch] text-sm leading-relaxed text-gray-700 dark:text-gray-300">
      {allergensDisplay}
    </p>
  ) : (
    <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
      No allergens reported.
    </p>
  );

  const tabItems: TabItem[] = [
    { id: "overview", label: "Overview", panel: overviewPanel },
    { id: "ingredients", label: "Ingredients", panel: ingredientsPanel },
    { id: "nutrition", label: "Nutrition", panel: nutritionPanel },
    { id: "allergens", label: "Allergens", panel: allergensPanel },
  ];

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:translate-y-0 motion-reduce:transition-none dark:bg-gray-800/50 dark:ring-1 dark:ring-gray-800">
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:gap-8">
        <div className="shrink-0 sm:w-44">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="h-36 w-full rounded-xl object-contain bg-gray-50 dark:bg-gray-700/30 sm:h-40"
            />
          ) : (
            <div
              className="flex h-36 w-full flex-col items-center justify-center gap-1.5 rounded-xl bg-gray-100 text-gray-400 dark:bg-gray-700/30 dark:text-gray-500 sm:h-40"
              aria-hidden
            >
              <span className="text-3xl opacity-40">📦</span>
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              ref={productTitleRef}
              id="product-title"
              tabIndex={-1}
              className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded"
            >
              {name}
            </h2>
            {isBeauty && (
              <span className="rounded-md bg-gray-200/80 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                Beauty
              </span>
            )}
            {!isBeauty && (
              <span className="rounded-md bg-gray-200/80 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                Food
              </span>
            )}
          </div>
          {brand && brand !== NA && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {brand}
            </p>
          )}
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            Barcode: {barcode}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <FavoriteButton
              barcode={barcode}
              isFavorite={isFavorite}
              onToggle={onToggleFavorite}
            />
            {getProductUrl && (
              <div className="relative inline-flex">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  aria-label="Copy link to this product"
                >
                  {copyDone ? "Copied!" : "Copy link"}
                </button>
                {copyDone && (
                  <span
                    role="status"
                    aria-live="polite"
                    className="absolute -bottom-8 left-0 rounded-lg bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm dark:bg-gray-700"
                  >
                    Copied to clipboard
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 dark:border-gray-700/50">
        <Tabs items={tabItems} defaultTab="overview" />
      </div>
    </article>
  );
}
