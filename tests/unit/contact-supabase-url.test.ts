import { describe, expect, it, vi } from "vitest";

// supabase-store imports "server-only", which throws outside a server bundle.
vi.mock("server-only", () => ({}));

const { normalizeSupabaseUrl } = await import("@/lib/contact/supabase-store");

describe("normalizeSupabaseUrl", () => {
  it.each([
    "https://abcd1234efgh5678ijkl.supabase.co",
    "https://abcd1234efgh5678ijkl.supabase.co/",
    "https://abcd1234efgh5678ijkl.supabase.co/rest/v1",
    "https://abcd1234efgh5678ijkl.supabase.co/rest/v1/",
    "  https://abcd1234efgh5678ijkl.supabase.co/rest/v1/  ",
  ])("reduces %j to the project origin", (raw) => {
    expect(normalizeSupabaseUrl(raw)).toBe(
      "https://abcd1234efgh5678ijkl.supabase.co",
    );
  });

  it("rejects something that is not a URL", () => {
    expect(() => normalizeSupabaseUrl("not a url")).toThrow();
  });
});
