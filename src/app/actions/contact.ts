"use server";

import { headers } from "next/headers";

import type { ContactSource } from "@/lib/contact/store";
import { getContactStore } from "@/lib/contact/store";
import {
  handleContactSubmission,
  type ContactState,
} from "@/lib/contact/submit";

function currentSource(): ContactSource {
  if (process.env.VERCEL_ENV === "production") return "production";
  if (process.env.VERCEL_ENV === "preview") return "preview";
  return "development";
}

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown";
  const salt =
    process.env.CONTACT_IP_SALT ??
    (currentSource() === "development" ? "dev-salt" : "");

  try {
    if (!salt) throw new Error("CONTACT_IP_SALT is not set");
    const store = await getContactStore();
    return await handleContactSubmission(formData, {
      store,
      ip,
      salt,
      source: currentSource(),
    });
  } catch (error) {
    console.error(
      "contact: not configured:",
      error instanceof Error ? error.message : "unknown",
    );
    return { status: "error" };
  }
}
