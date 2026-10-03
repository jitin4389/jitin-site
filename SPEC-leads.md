# Spec: leads

**Status: ✅ complete (2026-10-04).** Module `leads` from [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Depends on `foundation` (complete). Completes the "first public launch" set.

## Objective

Let visitors send you a message from the site, and keep every message safely in a database you own. Today the only option is "email me", which loses context and gives you nothing to triage.

**Users**

- _Visitor (recruiter, client, peer):_ fills a short form in the Contact section, gets clear confirmation or a clear error with a fallback.
- _Jitin (owner):_ reads messages in the Supabase dashboard, sorted by date and topic.

**Decisions (2026-10-03)**

| Question        | Decision                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------- |
| Notification    | **Supabase only.** No email service; you check the dashboard                                  |
| Newsletter      | **Later**, moved to the `writing` module                                                      |
| Spam protection | **Honeypot + per-IP rate limit**, server-side, no third party                                 |
| Fields          | **Name, email, topic, message.** Topic: Hiring · Consulting / project · Collaboration · Other |

**Acceptance criteria**

- [x] The Contact section shows a form (name, email, topic, message) next to the existing email and LinkedIn links. A "Contact" nav item jumps to it.
- [x] Valid submissions are stored in Supabase table `contact_messages` and the visitor sees a success message.
- [x] Invalid input shows field-level errors (announced to screen readers); nothing is stored.
- [x] Limits: name ≤ 100 chars, email valid and ≤ 254, message 10–4,000 chars, topic from the fixed list.
- [x] Honeypot: if the hidden field is filled, the visitor sees "success" but nothing is stored.
- [x] Rate limit: more than **5 submissions per IP per hour** are rejected with a friendly message. IPs are stored only as a salted hash.
- [x] If Supabase is unreachable, the visitor sees an error with the email fallback; the error is logged server-side.
- [x] The database is locked down: row-level security on, no public read or write; only the server (secret key) can insert.
- [x] Secrets live only in Vercel environment variables, never in the repo or the browser bundle.
- [x] Preview deployments tag rows `source = 'preview'` so test messages are easy to filter out.
- [x] Works without JavaScript (plain form POST via a Server Action); zero axe violations in both themes; Lighthouse holds.

## Tech Stack

| Concern    | Choice                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| Database   | Supabase Postgres (free tier), project region **Mumbai (ap-south-1)**, account under jitin4389@gmail.com |
| Client     | `@supabase/supabase-js` 2.x, **server-only** (new dependency, approved with this spec)                   |
| Submission | Next.js Server Action + `useActionState` (progressive enhancement)                                       |
| Validation | Small hand-written validator shared by server and tests (no new library)                                 |
| Schema     | SQL migration in `supabase/migrations/`, applied once via the Supabase SQL editor                        |

### Data model

```sql
create type contact_topic as enum ('hiring', 'consulting', 'collaboration', 'other');

create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 100),
  email       text not null check (char_length(email) between 3 and 254),
  topic       contact_topic not null,
  message     text not null check (char_length(message) between 10 and 4000),
  ip_hash     text not null,
  source      text not null default 'production' check (source in ('production', 'preview', 'development')),
  status      text not null default 'new' check (status in ('new', 'replied', 'archived'))
);

create index contact_messages_ip_recent on public.contact_messages (ip_hash, created_at desc);
alter table public.contact_messages enable row level security;
-- No policies: anon and authenticated roles can do nothing. The server uses the secret key.
```

### Environment variables (Vercel: Production + Preview)

| Name                  | Purpose                                |
| --------------------- | -------------------------------------- |
| `SUPABASE_URL`        | Project URL                            |
| `SUPABASE_SECRET_KEY` | Server-only secret key (`sb_secret_…`) |
| `CONTACT_IP_SALT`     | Random string for hashing IPs          |

None are `NEXT_PUBLIC_*`.

## Commands

```bash
npm run dev            # needs .env.local with the three variables (git-ignored)
npm run check          # lint + typecheck + unit + build
npm run test:e2e       # runs against an in-memory store (CONTACT_STORE=memory), never the real DB
```

## Project Structure (additions)

```
supabase/migrations/0001_contact_messages.sql   → schema above
src/lib/contact/validate.ts       → pure validation (shared by action and tests)
src/lib/contact/store.ts          → ContactStore interface + Supabase and in-memory implementations
src/lib/contact/rate-limit.ts     → per-IP hourly limit using the store
src/app/actions/contact.ts        → "use server" action: honeypot → validate → rate-limit → insert
src/components/profile/contact-form.tsx  → client form with useActionState
src/components/profile/contact.tsx       → section now includes the form
tests/unit/contact-*.test.ts      → validation, honeypot, rate limit, action flow with memory store
tests/e2e/contact.spec.ts         → submit success, field errors, no-JS submit, axe
```

## Code Style

Same as earlier modules. The store is injected so the action can be tested without a network:

```ts
// src/lib/contact/store.ts
export interface ContactStore {
  countRecentByIp(ipHash: string, since: Date): Promise<number>;
  insert(message: NewContactMessage): Promise<void>;
}

export function getContactStore(): ContactStore {
  return process.env.CONTACT_STORE === "memory"
    ? memoryStore
    : createSupabaseStore();
}
```

## Testing Strategy

| Level              | Covers                                                                                                                                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit               | Validator edge cases (lengths, email format, unknown topic, trimming); honeypot short-circuit; rate limit at 5/hour boundary; action returns field errors vs success vs service error; IP hashing never returns the raw IP |
| E2E (memory store) | Fill and submit → success message; empty submit → errors announced and focus on first invalid field; submit with JavaScript disabled still works; axe clean with errors shown, in both themes                              |
| Manual, once       | On the preview: one real submission appears in Supabase with `source = preview`; then delete it. Confirm the anon key cannot read the table                                                                                |

## Boundaries

**Always:** keep the secret key server-only; store salted IP hashes, never raw IPs; tag non-production rows; validate on the server even when the browser already did.

**Ask first:** any email or notification service; any analytics on the form; schema changes after launch; storing anything beyond the five fields.

**Never:** expose `SUPABASE_SECRET_KEY` or create `NEXT_PUBLIC_` Supabase vars; enable public read on `contact_messages`; run e2e tests against the real database; promise a reply time on the form.

## Success Criteria

`leads` is done when every acceptance criterion is checked, all tests pass, one real preview submission has been verified and deleted, Lighthouse holds on production, and you've approved the form.

## What you'll need to do (setup)

1. Create a Supabase account with **jitin4389@gmail.com** (GitHub login as `jitin4389` is fine) and a project `jitin-site` in **Mumbai**.
2. Paste the migration SQL into the SQL editor (I'll give you the exact file).
3. Share the project URL and secret key with me privately, or add the three variables in Vercel yourself. I'll guide either way.

## Decisions on open questions (2026-10-03)

| Question     | Decision                                                           |
| ------------ | ------------------------------------------------------------------ |
| Privacy note | "Your details are only used to reply to you and are never shared." |
| Retention    | Keep messages indefinitely; archive via `status`                   |
