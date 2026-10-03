import { describe, expect, it } from "vitest";

import { formatMonth, formatRange } from "@/lib/dates";

describe("dates", () => {
  it("formats a month", () => {
    expect(formatMonth("2025-07")).toBe("Jul 2025");
  });

  it("formats open and closed ranges", () => {
    expect(formatRange("2025-07")).toBe("Jul 2025 – Present");
    expect(formatRange("2024-10", "2025-06")).toBe("Oct 2024 – Jun 2025");
  });

  it("rejects malformed input", () => {
    expect(() => formatMonth("2025-13")).toThrow();
    expect(() => formatMonth("July 2025")).toThrow();
  });
});
