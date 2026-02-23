import { describe, it, expect } from "vitest";
import { computeHealthScore } from "./score";
import { normalizeProduct } from "../api/normalizeProduct";
import type { OpenFoodFactsProduct } from "../api/openFoodFacts";

function norm(raw: OpenFoodFactsProduct) {
  return normalizeProduct(raw);
}

describe("computeHealthScore", () => {
  it("returns base score 70 when product has no optional fields", () => {
    const product = norm({});
    const { score, breakdown } = computeHealthScore(product);
    expect(score).toBe(70);
    expect(breakdown).toHaveLength(0);
  });

  it("adds +20 for Nutri-Score A", () => {
    const product = norm({ nutriscore_grade: "a" });
    const { score } = computeHealthScore(product);
    expect(score).toBe(90);
  });

  it("adds +12 for Nutri-Score B", () => {
    const product = norm({ nutriscore_grade: "b" });
    const { score } = computeHealthScore(product);
    expect(score).toBe(82);
  });

  it("uses nutrition_grades when nutriscore_grade is missing", () => {
    const product = norm({ nutrition_grades: "b" });
    const { score } = computeHealthScore(product);
    expect(score).toBe(82);
  });

  it("adds +5 for Nutri-Score C", () => {
    const product = norm({ nutriscore_grade: "c" });
    const { score } = computeHealthScore(product);
    expect(score).toBe(75);
  });

  it("subtracts 5 for Nutri-Score D", () => {
    const product = norm({ nutriscore_grade: "d" });
    const { score } = computeHealthScore(product);
    expect(score).toBe(65);
  });

  it("subtracts 15 for Nutri-Score E", () => {
    const product = norm({ nutriscore_grade: "e" });
    const { score } = computeHealthScore(product);
    expect(score).toBe(55);
  });

  it("penalizes additives (min 25)", () => {
    const product = norm({
      additives_n: 10,
      nutriments: {},
    });
    const { score } = computeHealthScore(product);
    expect(score).toBe(45); // 70 - 25
  });

  it("penalizes high sugar > 15", () => {
    const product = norm({
      nutriments: { sugars_100g: 20 },
    });
    const { score } = computeHealthScore(product);
    expect(score).toBe(58); // 70 - 12
  });

  it("penalizes moderate sugar > 8", () => {
    const product = norm({
      nutriments: { sugars_100g: 10 },
    });
    const { score } = computeHealthScore(product);
    expect(score).toBe(64); // 70 - 6
  });

  it("penalizes high saturated fat > 5", () => {
    const product = norm({
      nutriments: { "saturated-fat_100g": 6 },
    });
    const { score } = computeHealthScore(product);
    expect(score).toBe(60); // 70 - 10
  });

  it("penalizes high salt > 1.5", () => {
    const product = norm({
      nutriments: { salt_100g: 2 },
    });
    const { score } = computeHealthScore(product);
    expect(score).toBe(60); // 70 - 10
  });

  it("bonus for high fiber >= 6", () => {
    const product = norm({
      nutriments: { fiber_100g: 7 },
    });
    const { score } = computeHealthScore(product);
    expect(score).toBe(76); // 70 + 6
  });

  it("bonus for moderate fiber >= 3", () => {
    const product = norm({
      nutriments: { fiber_100g: 4 },
    });
    const { score } = computeHealthScore(product);
    expect(score).toBe(73); // 70 + 3
  });

  it("clamps score to 0-100", () => {
    const product = norm({
      nutriscore_grade: "e",
      additives_n: 20,
      nutriments: {
        sugars_100g: 25,
        "saturated-fat_100g": 10,
        salt_100g: 3,
      },
    });
    const { score } = computeHealthScore(product);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("combined: A grade + fiber bonus", () => {
    const product = norm({
      nutriscore_grade: "a",
      nutriments: { fiber_100g: 6 },
    });
    const { score, breakdown } = computeHealthScore(product);
    expect(score).toBe(96); // 70 + 20 + 6
    expect(breakdown.some((b) => b.label === "Nutri-Score" && b.delta === 20)).toBe(true);
    expect(breakdown.some((b) => b.label === "Fiber" && b.delta === 6)).toBe(true);
  });

  it("ignores undefined nutriments (no penalty)", () => {
    const product = norm({});
    const { score } = computeHealthScore(product);
    expect(score).toBe(70);
  });

  it("handles zero values without penalty", () => {
    const product = norm({
      nutriments: {
        sugars_100g: 0,
        "saturated-fat_100g": 0,
        salt_100g: 0,
      },
    });
    const { score } = computeHealthScore(product);
    expect(score).toBe(70);
  });

  it("ignores invalid nutriscore grade", () => {
    const product = norm({ nutriscore_grade: "x" as string });
    const { score, breakdown } = computeHealthScore(product);
    expect(score).toBe(70);
    expect(breakdown).toHaveLength(0);
  });
});
