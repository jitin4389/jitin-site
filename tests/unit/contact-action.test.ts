import { describe, expect, it, vi } from "vitest";

import { RATE_LIMIT, hashIp } from "@/lib/contact/rate-limit";
import { createMemoryStore, type ContactStore } from "@/lib/contact/store";
import { HONEYPOT_FIELD, handleContactSubmission } from "@/lib/contact/submit";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const validFields = {
  name: "Ada",
  email: "ada@example.com",
  topic: "consulting",
  message: "Hello there, Jitin!",
};
const context = (store: ContactStore) => ({
  store,
  ip: "203.0.113.7",
  salt: "s",
  source: "preview" as const,
});

describe("handleContactSubmission", () => {
  it("stores a valid message with hashed IP and source, and reports success", async () => {
    const store = createMemoryStore();
    const state = await handleContactSubmission(
      form(validFields),
      context(store),
    );
    expect(state).toEqual({ status: "success" });
    expect(store.messages).toHaveLength(1);
    expect(store.messages[0]).toMatchObject({
      ...validFields,
      ipHash: hashIp("203.0.113.7", "s"),
      source: "preview",
    });
    expect(Object.keys(store.messages[0]).sort()).toEqual(
      [
        "createdAt",
        "email",
        "ipHash",
        "message",
        "name",
        "source",
        "topic",
      ].sort(),
    );
  });

  it("pretends success but stores nothing when the honeypot is filled", async () => {
    const store = createMemoryStore();
    const state = await handleContactSubmission(
      form({ ...validFields, [HONEYPOT_FIELD]: "http://spam" }),
      context(store),
    );
    expect(state.status).toBe("success");
    expect(store.messages).toHaveLength(0);
  });

  it("returns field errors and the typed values, storing nothing, when invalid", async () => {
    const store = createMemoryStore();
    const state = await handleContactSubmission(
      form({ ...validFields, email: "nope" }),
      context(store),
    );
    expect(state.status).toBe("invalid");
    expect(state.fieldErrors?.email).toBeDefined();
    expect(state.values?.name).toBe("Ada");
    expect(store.messages).toHaveLength(0);
  });

  it("rejects once the rate limit is reached", async () => {
    const store = createMemoryStore();
    for (let i = 0; i < RATE_LIMIT.max; i++)
      await handleContactSubmission(form(validFields), context(store));
    const state = await handleContactSubmission(
      form(validFields),
      context(store),
    );
    expect(state.status).toBe("limited");
    expect(store.messages).toHaveLength(RATE_LIMIT.max);
  });

  it("returns an error instead of throwing when the store fails, without logging personal data", async () => {
    const failing: ContactStore = {
      countRecentByIp: async () => 0,
      insert: async () => {
        throw new Error("connection refused");
      },
    };
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const state = await handleContactSubmission(
      form(validFields),
      context(failing),
    );
    expect(state.status).toBe("error");
    const logged = JSON.stringify(log.mock.calls);
    expect(logged).not.toContain("ada@example.com");
    expect(logged).not.toContain("203.0.113.7");
    log.mockRestore();
  });
});
