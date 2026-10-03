import { hashIp, isRateLimited } from "@/lib/contact/rate-limit";
import type { ContactSource, ContactStore } from "@/lib/contact/store";
import {
  validateContact,
  type ContactInput,
  type FieldErrors,
} from "@/lib/contact/validate";

export const HONEYPOT_FIELD = "website";

export type ContactState = {
  status: "idle" | "success" | "invalid" | "limited" | "error";
  fieldErrors?: FieldErrors;
  /** Echoed back so the form keeps what the visitor typed (also without JavaScript). */
  values?: Partial<ContactInput>;
};

export const initialContactState: ContactState = { status: "idle" };

type SubmitContext = {
  store: ContactStore;
  ip: string;
  salt: string;
  source: ContactSource;
  now?: Date;
};

/** honeypot → validate → rate limit → insert. Never throws. */
export async function handleContactSubmission(
  formData: FormData,
  { store, ip, salt, source, now = new Date() }: SubmitContext,
): Promise<ContactState> {
  // Bots fill every field; people never see this one. Pretend it worked.
  if (String(formData.get(HONEYPOT_FIELD) ?? "").trim() !== "")
    return { status: "success" };

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    topic: formData.get("topic"),
    message: formData.get("message"),
  };
  const values = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      typeof value === "string" ? value : "",
    ]),
  ) as Partial<ContactInput>;

  const result = validateContact(raw);
  if (!result.ok)
    return { status: "invalid", fieldErrors: result.errors, values };

  try {
    const ipHash = hashIp(ip, salt);
    if (await isRateLimited(store, ipHash, now))
      return { status: "limited", values };
    await store.insert({ ...result.data, ipHash, source });
    return { status: "success" };
  } catch (error) {
    // Log the failure type only; never personal data.
    console.error(
      "contact: submission failed:",
      error instanceof Error ? error.message : "unknown",
    );
    return { status: "error", values };
  }
}
