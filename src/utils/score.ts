/**
 * Health Score algorithm (0–100) and breakdown for Product Insight Scanner.
 */

import type { NormalizedProduct } from "../api/normalizeProduct";

export interface ScoreBreakdownItem {
  label: string;
  delta: number;
  reason: string;
}

export interface HealthScoreResult {
  score: number;
  breakdown: ScoreBreakdownItem[];
}

/** Score band for accessibility (label, not color alone). */
export type ScoreBand = "Excellent" | "Good" | "Okay" | "Poor";

export function getScoreBand(score: number): ScoreBand {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Okay";
  return "Poor";
}

/**
 * Computes Health Score (0–100) and breakdown for food products.
 * Uses normalized product (nutri-score, nutriments, additives).
 */
export function computeHealthScore(product: NormalizedProduct): HealthScoreResult {
  const breakdown: ScoreBreakdownItem[] = [];
  let score = 70;

  const grade = product.nutriscoreGrade?.toLowerCase();
  if (grade) {
    const gradeDeltas: Record<string, number> = {
      a: 20,
      b: 12,
      c: 5,
      d: -5,
      e: -15,
    };
    const delta = gradeDeltas[grade] ?? 0;
    score += delta;
    breakdown.push({
      label: "Nutri-Score",
      delta,
      reason: `Grade ${grade.toUpperCase()}`,
    });
  }

  const additivesN = product.additivesN;
  if (additivesN > 0) {
    const penalty = Math.min(additivesN * 3, 25);
    score -= penalty;
    breakdown.push({
      label: "Additives",
      delta: -penalty,
      reason: `${additivesN} additive(s)`,
    });
  }

  const n = product.nutriments;

  const sugars = n.sugars100g;
  if (sugars != null) {
    if (sugars > 15) {
      score -= 12;
      breakdown.push({
        label: "Sugar",
        delta: -12,
        reason: `High sugar (${sugars}g/100g)`,
      });
    } else if (sugars > 8) {
      score -= 6;
      breakdown.push({
        label: "Sugar",
        delta: -6,
        reason: `Moderate sugar (${sugars}g/100g)`,
      });
    }
  }

  const satFat = n.saturatedFat100g;
  if (satFat != null) {
    if (satFat > 5) {
      score -= 10;
      breakdown.push({
        label: "Saturated fat",
        delta: -10,
        reason: `High (${satFat}g/100g)`,
      });
    } else if (satFat > 2) {
      score -= 5;
      breakdown.push({
        label: "Saturated fat",
        delta: -5,
        reason: `Moderate (${satFat}g/100g)`,
      });
    }
  }

  const salt = n.salt100g;
  if (salt != null) {
    if (salt > 1.5) {
      score -= 10;
      breakdown.push({
        label: "Salt",
        delta: -10,
        reason: `High (${salt}g/100g)`,
      });
    } else if (salt > 0.75) {
      score -= 5;
      breakdown.push({
        label: "Salt",
        delta: -5,
        reason: `Moderate (${salt}g/100g)`,
      });
    }
  }

  const fiber = n.fiber100g;
  if (fiber != null) {
    if (fiber >= 6) {
      score += 6;
      breakdown.push({
        label: "Fiber",
        delta: 6,
        reason: `High fiber (${fiber}g/100g)`,
      });
    } else if (fiber >= 3) {
      score += 3;
      breakdown.push({
        label: "Fiber",
        delta: 3,
        reason: `Moderate fiber (${fiber}g/100g)`,
      });
    }
  }

  const clamped = Math.round(Math.max(0, Math.min(100, score)));

  return { score: clamped, breakdown };
}
