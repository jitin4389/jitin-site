import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { ContactStore } from "@/lib/contact/store";

/** Supabase-backed store. Uses the secret key, so it must never run in the browser. */
export function createSupabaseStore(): ContactStore {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey)
    throw new Error("SUPABASE_URL or SUPABASE_SECRET_KEY is not set");

  const supabase = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const table = () => supabase.from("contact_messages");

  return {
    async countRecentByIp(ipHash, since) {
      const { count, error } = await table()
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", since.toISOString());
      if (error) throw new Error(`count failed: ${error.code ?? "unknown"}`);
      return count ?? 0;
    },
    async insert(message) {
      const { error } = await table().insert({
        name: message.name,
        email: message.email,
        topic: message.topic,
        message: message.message,
        ip_hash: message.ipHash,
        source: message.source,
      });
      if (error) throw new Error(`insert failed: ${error.code ?? "unknown"}`);
    },
  };
}
