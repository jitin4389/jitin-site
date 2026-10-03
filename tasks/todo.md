# Tasks: leads

Plan: [plan.md](plan.md) · Spec: [SPEC-leads.md](../SPEC-leads.md)
Definition of done for every task: `npm run check` green with no warnings, `npm run test:e2e` green, committed on a branch.

---

## Phase 1: Logic

### L1: Validation ✅ done

**Description:** `validateContact(formData)` trims inputs and returns either clean data or per-field errors.

**Acceptance criteria:**

- [x] Name 1–100 chars; email valid format and ≤ 254; topic in the fixed list; message 10–4,000 chars
- [x] Returns all field errors at once, with human-readable messages
- [x] Unit tests cover each boundary (e.g. 100 vs 101 chars, 9 vs 10)

**Verification:** `npm test`
**Dependencies:** None
**Files:** `src/lib/contact/validate.ts`, `tests/unit/contact-validate.test.ts`
**Scope:** S

### L2: Store, rate limit, IP hashing ✅ done

**Description:** `ContactStore` interface; in-memory implementation; `getContactStore()` selector; `hashIp(ip, salt)`; `isRateLimited(store, ipHash, now)` (more than 5 in the last hour).

**Acceptance criteria:**

- [x] 5 submissions in an hour pass; the 6th is limited; one older than an hour doesn't count
- [x] `hashIp` is deterministic per salt and never contains the raw IP
- [x] `CONTACT_STORE=memory` selects the in-memory store

**Verification:** `npm test`
**Dependencies:** None
**Files:** `src/lib/contact/store.ts`, `src/lib/contact/rate-limit.ts`, `tests/unit/contact-store.test.ts`
**Scope:** M

### L3: Server action ✅ done

**Description:** `submitContact(prevState, formData)`: honeypot → validate → rate limit → insert with `source` from `VERCEL_ENV`. Returns `{ status: "success" | "invalid" | "limited" | "error", fieldErrors? }`. Logs errors server-side without personal data.

**Acceptance criteria:**

- [x] Filled honeypot → "success", nothing stored
- [x] Invalid → field errors, nothing stored; limited → "limited", nothing stored
- [x] Store failure → "error" (no crash); success stores exactly the five fields plus `ip_hash` and `source`

**Verification:** `npm test` (`tests/unit/contact-action.test.ts` with the in-memory store)
**Dependencies:** L1, L2
**Files:** `src/app/actions/contact.ts`, `tests/unit/contact-action.test.ts`
**Scope:** M

---

## Phase 2: UI

### L4: Contact form ✅ done

**Description:** Client form using `useActionState`: name, email, topic select, message, hidden honeypot, privacy note, submit button with pending state. Success replaces the form with a thank-you message. Errors are shown per field and announced. Enable the "Contact" nav item (`/#contact`). Playwright web server runs with `CONTACT_STORE=memory`.

**Acceptance criteria:**

- [x] Valid submit → success message; empty submit → errors announced, focus moves to the first invalid field
- [x] Submitting with JavaScript disabled still works
- [x] Axe clean with errors visible, in both themes; no horizontal scroll at 360 px

**Verification:** `npm run check`; `tests/e2e/contact.spec.ts`
**Dependencies:** L3
**Files:** `src/components/profile/contact-form.tsx`, `src/components/profile/contact.tsx`, `src/config/site.ts`, `playwright.config.ts`, `tests/e2e/contact.spec.ts`
**Scope:** M

### ✅ Checkpoint A

- [x] All tests green; axe clean with errors shown, both themes

---

## Phase 3: Supabase

### L5: Supabase store and environment ⚠️ needs your setup

**Description:** Add `@supabase/supabase-js`; `supabase-store.ts` (guarded by `server-only`); migration file; you run the SQL and add env vars in Vercel (Production + Preview).

**Acceptance criteria:**

- [ ] Migration applied: table, enum, index, RLS on, no policies
- [ ] Env vars set in Vercel; none are `NEXT_PUBLIC_`
- [ ] Build output contains no `sb_secret` string

**Verification:** `npm run check`; `grep -r sb_secret .next/static` returns nothing
**Dependencies:** L3, your Supabase project
**Files:** `supabase/migrations/0001_contact_messages.sql`, `src/lib/contact/supabase-store.ts`, `src/lib/contact/store.ts`, `package.json`, `.env.example`
**Scope:** M

### L6: Preview integration check ⚠️ with you

**Description:** On the PR preview, submit one real message; confirm it appears in Supabase with `source = preview`; confirm the anon key cannot read the table; delete the test row.

**Acceptance criteria:**

- [ ] Row visible in the dashboard with correct fields and hashed IP
- [ ] Anon REST read returns no rows or a permission error
- [ ] Test row deleted

**Verification:** Supabase dashboard; `curl` with the anon key
**Dependencies:** L4, L5
**Files:** none
**Scope:** S

### ✅ Checkpoint B

- [ ] **You submit on the preview and see the message in your dashboard**

---

## Phase 4: Ship

### L7: Production ⚠️ needs your go-ahead to merge

**Description:** Merge; verify the form renders in production (no test submission unless you want one); Lighthouse; record results; mark module complete.

**Acceptance criteria:**

- [ ] Lighthouse on `/` still ≥ 95 / 100 / ≥ 95 / 100
- [ ] All SPEC-leads acceptance criteria checked

**Verification:** `PLAYWRIGHT_BASE_URL=https://jitin-site.vercel.app` read-only e2e subset; Lighthouse
**Dependencies:** L6
**Files:** `README.md`, `SPEC-leads.md`, `CAPABILITY-MAP.md`, tasks files
**Scope:** S
