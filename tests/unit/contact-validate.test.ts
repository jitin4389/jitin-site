import { describe, expect, it } from "vitest";

import { validateContact } from "@/lib/contact/validate";

const valid = {
  name: "Ada",
  email: "ada@example.com",
  topic: "hiring",
  message: "Hello there, Jitin!",
};

describe("validateContact", () => {
  it("accepts valid input and trims it", () => {
    const result = validateContact({
      ...valid,
      name: "  Ada  ",
      email: " ada@example.com ",
    });
    expect(result).toEqual({ ok: true, data: { ...valid } });
  });

  it("reports every invalid field at once", () => {
    const result = validateContact({
      name: "",
      email: "nope",
      topic: "spam",
      message: "hi",
    });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(Object.keys(result.errors).sort()).toEqual([
        "email",
        "message",
        "name",
        "topic",
      ]);
  });

  it("treats missing and non-string values as empty", () => {
    const result = validateContact({
      name: undefined,
      email: 42 as unknown as string,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.name).toBeDefined();
  });

  it.each([
    ["name at 100 chars", { name: "a".repeat(100) }, true],
    ["name at 101 chars", { name: "a".repeat(101) }, false],
    ["message at 10 chars", { message: "a".repeat(10) }, true],
    ["message at 9 chars", { message: "a".repeat(9) }, false],
    ["message at 4000 chars", { message: "a".repeat(4000) }, true],
    ["message at 4001 chars", { message: "a".repeat(4001) }, false],
    ["email at 254 chars", { email: `${"a".repeat(242)}@example.com` }, true],
    ["email at 255 chars", { email: `${"a".repeat(243)}@example.com` }, false],
    ["email without a dot in the domain", { email: "ada@example" }, false],
    ["each allowed topic", { topic: "other" }, true],
  ])("boundary: %s", (_label, override, ok) => {
    expect(validateContact({ ...valid, ...override }).ok).toBe(ok);
  });
});
