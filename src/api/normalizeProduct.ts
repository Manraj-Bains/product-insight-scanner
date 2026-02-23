/**
 * Normalized product type for UI and score logic.
 * Raw API responses are normalized here for consistent, defensive handling.
 */

import type { OpenFoodFactsProduct } from "./openFoodFacts";

export interface NormalizedNutriments {
  energyKcal100g: number | undefined;
  fat100g: number | undefined;
  saturatedFat100g: number | undefined;
  carbohydrates100g: number | undefined;
  sugars100g: number | undefined;
  fiber100g: number | undefined;
  proteins100g: number | undefined;
  salt100g: number | undefined;
}

export interface NormalizedProduct {
  name: string;
  brand: string;
  imageUrl: string | undefined;
  nutriscoreGrade: string | null;
  ingredientsText: string;
  ingredients: Array<{ text: string; percent?: number }>;
  allergensDisplay: string;
  allergensTags: string[];
  nutriments: NormalizedNutriments;
  additivesN: number;
  /** Raw product for any legacy use; prefer normalized fields. */
  raw: OpenFoodFactsProduct;
}

function toNumber(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function pickName(raw: OpenFoodFactsProduct & Record<string, unknown>): string {
  const name =
    raw.product_name ??
    raw.product_name_en ??
    (typeof raw.product_name_fr === "string" ? raw.product_name_fr : undefined) ??
    (typeof raw.product_name_de === "string" ? raw.product_name_de : undefined);
  if (typeof name === "string" && name.trim()) return name.trim();
  return "Unknown product";
}

function pickBrand(raw: OpenFoodFactsProduct): string {
  const b = raw.brands;
  return typeof b === "string" && b.trim() ? b.trim() : "";
}

export function normalizeProduct(raw: OpenFoodFactsProduct): NormalizedProduct {
  const r = raw as OpenFoodFactsProduct & Record<string, unknown>;
  const nutriments = raw.nutriments ?? {};
  return {
    name: pickName(r),
    brand: pickBrand(raw),
    imageUrl:
      typeof raw.image_front_url === "string" && raw.image_front_url.trim()
        ? raw.image_front_url.trim()
        : undefined,
    nutriscoreGrade: (() => {
      const g =
        raw.nutriscore_grade?.trim() ||
        raw.nutrition_grades?.trim() ||
        "";
      const letter = g.charAt(0).toUpperCase();
      return letter >= "A" && letter <= "E" ? letter : null;
    })(),
    ingredientsText: (() => {
      const t = raw.ingredients_text?.trim();
      if (t) return t;
      const arr = raw.ingredients;
      if (Array.isArray(arr) && arr.length > 0) {
        return arr
          .map((i) => (i && typeof i === "object" && "text" in i ? String((i as { text?: string }).text ?? "") : ""))
          .filter(Boolean)
          .join(", ");
      }
      return "";
    })(),
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients.map((i) => {
          const text =
            i && typeof i === "object" && "text" in i
              ? String((i as { text?: string }).text ?? "")
              : "";
          const pct =
            i && typeof i === "object"
              ? toNumber((i as { percent_estimate?: number }).percent_estimate) ??
                toNumber((i as { percent?: number }).percent)
              : undefined;
          return { text, percent: pct };
        })
      : [],
    allergensDisplay: (() => {
      if (raw.allergens?.trim()) return raw.allergens.trim();
      const tags = raw.allergens_tags;
      if (Array.isArray(tags) && tags.length > 0) {
        return tags
          .filter((t): t is string => typeof t === "string")
          .map((t) =>
            t
              .replace(/^en:/i, "")
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())
          )
          .join(", ");
      }
      return "";
    })(),
    allergensTags: Array.isArray(raw.allergens_tags)
      ? raw.allergens_tags.filter((t): t is string => typeof t === "string")
      : [],
    nutriments: {
      energyKcal100g: toNumber(nutriments["energy-kcal_100g"]),
      fat100g: toNumber(nutriments.fat_100g),
      saturatedFat100g: toNumber(nutriments["saturated-fat_100g"]),
      carbohydrates100g: toNumber(nutriments.carbohydrates_100g),
      sugars100g: toNumber(nutriments.sugars_100g),
      fiber100g: toNumber(nutriments.fiber_100g),
      proteins100g: toNumber(nutriments.proteins_100g),
      salt100g: toNumber(nutriments.salt_100g),
    },
    additivesN: Math.max(0, Math.floor(Number(raw.additives_n) || 0)),
    raw,
  };
}
