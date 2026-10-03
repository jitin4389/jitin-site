import { createHash } from "node:crypto";

import type { ContactStore } from "@/lib/contact/store";

export const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 } as const;

/** One-way, salted hash so raw IP addresses are never stored. */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/** True when this IP already sent the maximum number of messages in the window. */
export async function isRateLimited(
  store: ContactStore,
  ipHash: string,
  now: Date = new Date(),
): Promise<boolean> {
  const since = new Date(now.getTime() - RATE_LIMIT.windowMs);
  return (await store.countRecentByIp(ipHash, since)) >= RATE_LIMIT.max;
}
