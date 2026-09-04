import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatDate,
  formatTime,
  getDaysBetween,
  truncate,
  parseJson,
} from "./utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});

describe("formatCurrency", () => {
  it("formats BDT with the taka symbol", () => {
    expect(formatCurrency(1500)).toBe("৳1,500");
  });

  it("formats other currencies with Intl", () => {
    expect(formatCurrency(50, "USD")).toContain("$");
  });
});

describe("formatDate", () => {
  it("formats a local date in en-GB style", () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe("5 Jan 2026");
  });

  it("accepts ISO strings", () => {
    const result = formatDate(new Date(2026, 5, 10).toISOString());
    expect(result).toMatch(/10 Jun 2026|9 Jun 2026/); // timezone-safe
  });
});

describe("formatTime", () => {
  it("formats morning times", () => {
    expect(formatTime("09:30")).toBe("9:30 AM");
  });

  it("formats afternoon times", () => {
    expect(formatTime("14:45")).toBe("2:45 PM");
  });

  it("handles midnight hour", () => {
    expect(formatTime("00:15")).toBe("12:15 AM");
  });

  it("handles noon hour", () => {
    expect(formatTime("12:00")).toBe("12:00 PM");
  });
});

describe("getDaysBetween", () => {
  it("counts inclusive days", () => {
    const start = new Date(2026, 0, 1);
    const end = new Date(2026, 0, 3);
    expect(getDaysBetween(start, end)).toBe(3);
  });

  it("returns 1 for the same day", () => {
    const same = new Date(2026, 0, 1);
    expect(getDaysBetween(same, same)).toBe(1);
  });
});

describe("truncate", () => {
  it("returns short strings unchanged", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long strings with ellipsis", () => {
    expect(truncate("hello world", 5)).toBe("hello...");
  });
});

describe("parseJson", () => {
  it("parses valid JSON", () => {
    expect(parseJson('{"a":1}', { a: 0 })).toEqual({ a: 1 });
  });

  it("returns fallback for null/undefined", () => {
    expect(parseJson(null, [])).toEqual([]);
    expect(parseJson(undefined, "x")).toBe("x");
  });

  it("returns fallback for invalid JSON", () => {
    expect(parseJson("{invalid", "fallback")).toBe("fallback");
  });
});