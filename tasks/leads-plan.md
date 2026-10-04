# Implementation Plan: leads

Spec: [SPEC-leads.md](../SPEC-leads.md) · Module map: [CAPABILITY-MAP.md](../CAPABILITY-MAP.md)
Tasks tracked in [tasks/leads-todo.md](leads-todo.md) (archived; module complete). Previous modules: [foundation](foundation-plan.md), [profile](profile-plan.md) (complete).

## Overview

Add a contact form to the Contact section. Submissions go through a Next.js Server Action that rejects spam (honeypot), validates, rate-limits per hashed IP, and inserts into a locked-down Supabase table. You read messages in the Supabase dashboard.

## Architecture Decisions

- **Logic before UI, and before Supabase.** Validation, rate limiting and the action are built and unit-tested against an in-memory store first. The Supabase account is only needed from L5, so your setup can run in parallel with L1–L4.
- **One `ContactStore` interface, two implementations.** In-memory (tests, e2e, local dev without secrets) and Supabase (preview and production). `CONTACT_STORE=memory` selects the in-memory store; e2e always sets it.
- **Server Action with `useActionState`.** The form is a real `<form action>`, so it works without JavaScript; with JavaScript it shows inline errors without a page reload.
- **Secret key on the server only.** `src/lib/contact/supabase-store.ts` imports `server-only`, so a client import fails the build.
- **Spam handling stays quiet.** A filled honeypot returns the same success response as a real message, so bots learn nothing.

## Dependency Graph

```
L1 Validation ──┐
L2 Store + rate limit + IP hash ──┴──► L3 Server action ──► L4 Form UI + nav
                                                              │
   (you) Supabase account + SQL ──► L5 Supabase store + env ──┴──► L6 Preview integration check
                                                                        │
                                                                   Checkpoint
                                                                        │
                                                                   L7 Merge + Lighthouse
```

## Task List

### Phase 1: Logic (no network)

- [x] L1: Validation module + tests
- [x] L2: Store interface, in-memory store, rate limiter, IP hashing + tests
- [x] L3: Server action (honeypot → validate → rate limit → insert → errors) + tests

### Phase 2: UI

- [x] L4: Contact form UI, Contact nav item, e2e against the in-memory store

### Checkpoint A: logic and UI done

- [x] All tests green; axe clean with errors shown, both themes

### Phase 3: Supabase (needs your setup)

- [x] L5: Migration file, Supabase store, Vercel env vars
- [x] L6: Real submission on preview verified in Supabase, anon access denied, test row deleted

### Checkpoint B: your review

- [x] **You submit the form on the preview and see it in your Supabase dashboard**

### Phase 4: Ship

- [x] L7: Merge to production; Lighthouse; mark module complete

## Risks and Mitigations

| Risk                                      | Impact | Mitigation                                                                                                       |
| ----------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| Secret key leaks to the browser           | High   | `server-only` import guard; no `NEXT_PUBLIC_` vars; build-output grep for `sb_secret` in L5                      |
| Table readable by the public              | High   | RLS on with no policies; L6 tests an anon read is denied                                                         |
| Missed messages (no email alert)          | Medium | Your choice; noted. Easy to add an email service later as its own task                                           |
| Rate-limit IP spoofing via headers        | Low    | Use Vercel's `x-forwarded-for` first hop; limit is a spam brake, not security                                    |
| Test data mixing with real messages       | Low    | `source` column (`preview` / `production` / `development`); e2e never touches Supabase                           |
| Free-tier project pauses after inactivity | Medium | Supabase pauses free projects after ~1 week idle; form shows the email fallback on errors. Revisit if it happens |

## Open Questions

None blocking.
