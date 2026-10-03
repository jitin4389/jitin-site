import { afterEach, describe, expect, it, vi } from "vitest";

import { RATE_LIMIT, hashIp, isRateLimited } from "@/lib/contact/rate-limit";
import {
  createMemoryStore,
  getContactStore,
  type NewContactMessage,
} from "@/lib/contact/store";

const message: NewContactMessage = {
  name: "Ada",
  email: "ada@example.com",
  topic: "hiring",
  message: "Hello there, Jitin!",
  ipHash: "abc",
  source: "development",
};

describe("hashIp", () => {
  it("is deterministic per salt and never contains the raw IP", () => {
    const hash = hashIp("203.0.113.7", "salt");
    expect(hash).toBe(hashIp("203.0.113.7", "salt"));
    expect(hash).not.toBe(hashIp("203.0.113.7", "other-salt"));
    expect(hash).not.toContain("203.0.113.7");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("isRateLimited", () => {
  it(`allows ${RATE_LIMIT.max} messages an hour and blocks the next`, async () => {
    const now = new Date("2026-10-03T12:00:00Z");
    const store = createMemoryStore(() => now);
    for (let i = 0; i < RATE_LIMIT.max; i++) {
      expect(await isRateLimited(store, "abc", now)).toBe(false);
      await store.insert(message);
    }
    expect(await isRateLimited(store, "abc", now)).toBe(true);
    expect(await isRateLimited(store, "other-ip", now)).toBe(false);
  });

  it("ignores messages older than the window", async () => {
    let clock = new Date("2026-10-03T10:00:00Z");
    const store = createMemoryStore(() => clock);
    for (let i = 0; i < RATE_LIMIT.max; i++) await store.insert(message);
    clock = new Date(clock.getTime() + RATE_LIMIT.windowMs + 1);
    expect(await isRateLimited(store, "abc", clock)).toBe(false);
  });
});

describe("getContactStore", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns the in-memory store when CONTACT_STORE=memory", async () => {
    vi.stubEnv("CONTACT_STORE", "memory");
    const store = await getContactStore();
    expect(typeof store.insert).toBe("function");
  });
});
