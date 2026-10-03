export const CONTACT_TOPICS = [
  { value: "hiring", label: "Hiring" },
  { value: "consulting", label: "Consulting / project" },
  { value: "collaboration", label: "Collaboration" },
  { value: "other", label: "Other" },
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["value"];
export type ContactField = "name" | "email" | "topic" | "message";
export type ContactInput = Record<ContactField, string>;
export type FieldErrors = Partial<Record<ContactField, string>>;

export const LIMITS = {
  name: { max: 100 },
  email: { max: 254 },
  message: { min: 10, max: 4000 },
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOPIC_VALUES: readonly string[] = CONTACT_TOPICS.map(
  (topic) => topic.value,
);

export type ValidationResult =
  | { ok: true; data: ContactInput & { topic: ContactTopic } }
  | { ok: false; errors: FieldErrors };

/** Trims and validates all fields, returning every error at once. */
export function validateContact(
  raw: Partial<Record<ContactField, unknown>>,
): ValidationResult {
  const value = (field: ContactField) =>
    typeof raw[field] === "string" ? raw[field].trim() : "";
  const data = {
    name: value("name"),
    email: value("email"),
    topic: value("topic"),
    message: value("message"),
  };
  const errors: FieldErrors = {};

  if (!data.name) errors.name = "Please enter your name.";
  else if (data.name.length > LIMITS.name.max)
    errors.name = `Please keep your name under ${LIMITS.name.max} characters.`;

  if (!data.email) errors.email = "Please enter your email address.";
  else if (
    data.email.length > LIMITS.email.max ||
    !EMAIL_PATTERN.test(data.email)
  )
    errors.email = "Please enter a valid email address.";

  if (!TOPIC_VALUES.includes(data.topic))
    errors.topic = "Please choose a topic.";

  if (data.message.length < LIMITS.message.min)
    errors.message = `Please write at least ${LIMITS.message.min} characters.`;
  else if (data.message.length > LIMITS.message.max)
    errors.message = `Please keep your message under ${LIMITS.message.max.toLocaleString("en")} characters.`;

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, data: { ...data, topic: data.topic as ContactTopic } };
}
