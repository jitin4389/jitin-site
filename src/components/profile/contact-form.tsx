"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { submitContact } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";
import { HONEYPOT_FIELD, initialContactState } from "@/lib/contact/submit";
import {
  CONTACT_TOPICS,
  LIMITS,
  type ContactField,
} from "@/lib/contact/validate";

const FIELD_ORDER: ContactField[] = ["name", "email", "topic", "message"];

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-destructive">
      {message}
    </p>
  );
}

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContact,
    initialContactState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};

  // Move focus to the first invalid field so keyboard and screen-reader users land on the problem.
  useEffect(() => {
    if (state.status !== "invalid") return;
    const first = FIELD_ORDER.find((field) => state.fieldErrors?.[field]);
    if (first)
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-primary/30 bg-accent/40 p-6 sm:p-8"
      >
        <CheckCircle2 aria-hidden="true" className="size-6 text-primary" />
        <p className="mt-3 text-lg font-medium">
          Thanks, your message is on its way.
        </p>
        <p className="mt-1 text-muted-foreground">
          I&apos;ll get back to you by email.
        </p>
      </div>
    );
  }

  const describedBy = (field: ContactField) =>
    errors[field] ? `${field}-error` : undefined;
  const labelClass = "text-sm font-medium";

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      aria-label="Contact form"
      className="space-y-5 rounded-2xl border border-border bg-card/40 p-6 sm:p-8"
    >
      <div role="status" aria-live="polite">
        {state.status === "invalid" && (
          <p className="text-sm text-destructive">
            Please fix the highlighted fields.
          </p>
        )}
        {state.status === "limited" && (
          <p className="text-sm text-destructive">
            You&apos;ve sent several messages recently. Please try again later,
            or email me at{" "}
            <a href={`mailto:${siteConfig.email}`} className="underline">
              {siteConfig.email}
            </a>
            .
          </p>
        )}
        {state.status === "error" && (
          <p className="text-sm text-destructive">
            Something went wrong sending your message. Please email me at{" "}
            <a href={`mailto:${siteConfig.email}`} className="underline">
              {siteConfig.email}
            </a>
            .
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Name
          </label>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            maxLength={LIMITS.name.max}
            defaultValue={values.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name")}
            className="mt-1.5 h-10"
          />
          <FieldError id="name-error" message={errors.name} />
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>
            Email
          </label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={LIMITS.email.max}
            defaultValue={values.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email")}
            className="mt-1.5 h-10"
          />
          <FieldError id="email-error" message={errors.email} />
        </div>
      </div>

      <div>
        <label htmlFor="contact-topic" className={labelClass}>
          Topic
        </label>
        <select
          id="contact-topic"
          name="topic"
          defaultValue={values.topic ?? ""}
          aria-invalid={Boolean(errors.topic)}
          aria-describedby={describedBy("topic")}
          className="mt-1.5 h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm dark:bg-input/30"
        >
          <option value="" disabled>
            Choose a topic
          </option>
          {CONTACT_TOPICS.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </select>
        <FieldError id="topic-error" message={errors.topic} />
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Message
        </label>
        <Textarea
          id="contact-message"
          name="message"
          rows={5}
          maxLength={LIMITS.message.max}
          defaultValue={values.message}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy("message")}
          className="mt-1.5"
        />
        <FieldError id="message-error" message={errors.message} />
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Your details are only used to reply to you and are never shared.
        </p>
        <Button type="submit" disabled={pending}>
          <Send aria-hidden="true" />
          {pending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
