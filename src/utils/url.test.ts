import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getProductUrl,
  getSearchParamsFromUrl,
  getInitialSearchValueFromUrl,
} from "./url";

describe("getProductUrl", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      value: {
        origin: "https://example.com",
        pathname: "/",
        search: "",
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("returns URL with barcode param", () => {
    expect(getProductUrl("3017620422003")).toBe(
      "https://example.com/?barcode=3017620422003"
    );
  });

  it("encodes barcode in URL", () => {
    const url = getProductUrl("1234567890123");
    expect(url).toContain("barcode=1234567890123");
  });
});

describe("getSearchParamsFromUrl", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      value: {
        origin: "https://example.com",
        pathname: "/",
        get search() {
          return this._search ?? "";
        },
        set search(v: string) {
          this._search = v;
        },
        _search: "",
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("returns barcode when present", () => {
    (window.location as { _search?: string })._search = "?barcode=3017620422003";
    expect(getSearchParamsFromUrl()).toEqual({
      barcode: "3017620422003",
      q: null,
    });
  });

  it("returns q when present", () => {
    (window.location as { _search?: string })._search = "?q=nutella";
    expect(getSearchParamsFromUrl()).toEqual({
      barcode: null,
      q: "nutella",
    });
  });

  it("returns nulls when no params", () => {
    (window.location as { _search?: string })._search = "";
    expect(getSearchParamsFromUrl()).toEqual({ barcode: null, q: null });
  });

  it("trims whitespace", () => {
    (window.location as { _search?: string })._search = "?barcode=  123  ";
    expect(getSearchParamsFromUrl().barcode).toBe("123");
  });
});

describe("getInitialSearchValueFromUrl", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      value: {
        get search() {
          return this._search ?? "";
        },
        set search(v: string) {
          this._search = v;
        },
        _search: "",
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("prefers barcode over q", () => {
    (window.location as { _search?: string })._search = "?barcode=123&q=nutella";
    expect(getInitialSearchValueFromUrl()).toBe("123");
  });

  it("returns q when barcode absent", () => {
    (window.location as { _search?: string })._search = "?q=nutella";
    expect(getInitialSearchValueFromUrl()).toBe("nutella");
  });

  it("returns empty string when no params", () => {
    (window.location as { _search?: string })._search = "";
    expect(getInitialSearchValueFromUrl()).toBe("");
  });
});
