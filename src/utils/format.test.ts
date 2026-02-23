import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatRelativeTime,
  formatExactTime,
  formatAllergenTag,
  formatAllergens,
  formatNutrient,
} from "./format";

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for very recent time', () => {
    vi.setSystemTime(new Date("2025-02-01T12:00:00Z"));
    expect(formatRelativeTime(Date.now() - 5 * 1000)).toBe("Just now");
  });

  it('returns "Xs ago" for seconds >= 10', () => {
    vi.setSystemTime(new Date("2025-02-01T12:00:00Z"));
    expect(formatRelativeTime(Date.now() - 15 * 1000)).toBe("15s ago");
  });

  it('returns "Xm ago" for minutes', () => {
    vi.setSystemTime(new Date("2025-02-01T12:00:00Z"));
    expect(formatRelativeTime(Date.now() - 2 * 60 * 1000)).toBe("2m ago");
  });

  it('returns "Xh ago" for hours', () => {
    vi.setSystemTime(new Date("2025-02-01T12:00:00Z"));
    expect(formatRelativeTime(Date.now() - 3 * 60 * 60 * 1000)).toBe("3h ago");
  });

  it('returns "Xd ago" for days', () => {
    vi.setSystemTime(new Date("2025-02-01T12:00:00Z"));
    expect(formatRelativeTime(Date.now() - 5 * 24 * 60 * 60 * 1000)).toBe("5d ago");
  });
});

describe("formatExactTime", () => {
  it("returns locale date and time string", () => {
    const ms = new Date("2025-02-01T14:30:00Z").getTime();
    const result = formatExactTime(ms);
    expect(result).toMatch(/2025|Feb|2\/1\/2025|1\/2\/2025/);
    expect(result.length).toBeGreaterThan(5);
  });
});

describe("formatAllergenTag", () => {
  it("strips en: prefix", () => {
    expect(formatAllergenTag("en:milk")).toBe("Milk");
  });

  it("replaces hyphens with spaces and title-cases", () => {
    expect(formatAllergenTag("en:tree-nuts")).toBe("Tree Nuts");
  });

  it("handles already clean tag", () => {
    expect(formatAllergenTag("milk")).toBe("Milk");
  });
});

describe("formatAllergens", () => {
  it("returns raw string when allergens is non-empty", () => {
    expect(formatAllergens("Milk, Soy")).toBe("Milk, Soy");
  });

  it("formats allergens_tags when allergens is empty", () => {
    expect(
      formatAllergens(undefined, ["en:milk", "en:soy"])
    ).toBe("Milk, Soy");
  });

  it('returns "Not available" when both missing', () => {
    expect(formatAllergens(undefined, undefined)).toBe("Not available");
    expect(formatAllergens("", [])).toBe("Not available");
  });

  it("prefers allergens over tags", () => {
    expect(formatAllergens("Gluten", ["en:milk"])).toBe("Gluten");
  });

  it("handles empty string and empty array", () => {
    expect(formatAllergens("", [])).toBe("Not available");
    expect(formatAllergens("", undefined)).toBe("Not available");
  });
});

describe("formatNutrient", () => {
  it("returns — for null/undefined", () => {
    expect(formatNutrient(undefined)).toBe("—");
    expect(formatNutrient(null)).toBe("—");
  });

  it("returns number with unit when provided", () => {
    expect(formatNutrient(25, "g")).toBe("25 g");
    expect(formatNutrient(100, "kcal")).toBe("100 kcal");
  });

  it("returns number only when no unit", () => {
    expect(formatNutrient(42)).toBe("42");
  });

  it("returns — for non-number value", () => {
    expect(formatNutrient(NaN)).toBe("—");
  });
});
