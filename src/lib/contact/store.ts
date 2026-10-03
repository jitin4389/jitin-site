import type { ContactTopic } from "@/lib/contact/validate";

export type ContactSource = "production" | "preview" | "development";

export type NewContactMessage = {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  ipHash: string;
  source: ContactSource;
};

export interface ContactStore {
  countRecentByIp(ipHash: string, since: Date): Promise<number>;
  insert(message: NewContactMessage): Promise<void>;
}

export type StoredMessage = NewContactMessage & { createdAt: Date };

/** In-memory store for tests, e2e runs and local development without secrets. */
export function createMemoryStore(now: () => Date = () => new Date()) {
  const messages: StoredMessage[] = [];
  return {
    messages,
    async countRecentByIp(ipHash: string, since: Date) {
      return messages.filter((m) => m.ipHash === ipHash && m.createdAt >= since)
        .length;
    },
    async insert(message: NewContactMessage) {
      messages.push({ ...message, createdAt: now() });
    },
  } satisfies ContactStore & { messages: StoredMessage[] };
}

const memoryStore = createMemoryStore();

/** `CONTACT_STORE=memory` selects the in-memory store; otherwise Supabase. */
export async function getContactStore(): Promise<ContactStore> {
  if (process.env.CONTACT_STORE === "memory") return memoryStore;
  // Imported lazily so tests and client bundles never load the server-only Supabase module.
  const { createSupabaseStore } = await import("@/lib/contact/supabase-store");
  return createSupabaseStore();
}
