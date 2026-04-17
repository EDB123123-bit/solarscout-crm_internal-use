# tasks.md — SolarScout Outreach Tool (SOT)

Implementatievolgorde voor Claude Code. Werk taken af in volgorde; markeer elke taak als `[x]` wanneer voltooid.

---

## Phase 0 — Project Bootstrap

- [ ] **T-01** Init Next.js 15 project with App Router, TypeScript, Tailwind CSS
- [ ] **T-02** Install and configure Shadcn/ui (`npx shadcn-ui@latest init`); set theme to neutral
- [ ] **T-03** Configure Supabase project; add env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] **T-04** Create `/lib/supabase/client.ts` (browser client) and `/lib/supabase/server.ts` (server client)
- [ ] **T-05** Configure Supabase Auth (email/password only); create `/app/(auth)/login` and `/app/(auth)/register` pages in Flemish
- [ ] **T-06** Set up middleware (`middleware.ts`) to protect all `/(dashboard)` routes; redirect unauthenticated users to `/login`

---

## Phase 1 — Database Schema

- [ ] **T-07** Write migration: `User` table (managed by Supabase Auth — verify fields)
- [ ] **T-08** Write migration: `MailboxConnection` table
- [ ] **T-09** Write migration: `Campaign` table with status CHECK constraint
- [ ] **T-10** Write migration: `SequenceStep` table
- [ ] **T-11** Write migration: `Contact` table with UNIQUE constraint on `email`
- [ ] **T-12** Write migration: `ScheduledSend` table (nullable `thread_id`)
- [ ] **T-13** Write migration: `EmailEvent` table
- [ ] **T-14** Write migration: `Reply` table
- [ ] **T-15** Commit all migrations to `/supabase/migrations/`
- [ ] **T-16** Create TypeScript types in `/types/index.ts` matching all tables

---

## Phase 2 — Mailbox Connection (OAuth)

- [ ] **T-17** Set up Gmail OAuth 2.0 credentials (Google Cloud Console); store client ID/secret in env
- [ ] **T-18** Set up Microsoft Azure app registration for Graph API; store credentials in env
- [ ] **T-19** Implement `/api/mailbox/connect/gmail/route.ts` — OAuth callback, token storage
- [ ] **T-20** Implement `/api/mailbox/connect/outlook/route.ts` — OAuth callback, token storage
- [ ] **T-21** Implement `/lib/token.ts` — `getValidAccessToken(userId)` with silent refresh logic
- [ ] **T-22** Build Settings page (`/app/(dashboard)/settings/page.tsx`) in Flemish: show connected mailbox, "Verbinden"/"Herverbinden" buttons, disconnect option

---

## Phase 3 — Contact Import

- [ ] **T-23** Implement `/lib/email-validator.ts` — RFC 5322 syntax check + `dns.promises.resolveMx` MX check
- [ ] **T-24** Build file upload component (Shadcn/ui `Input type="file"`) accepting `.xlsx` and `.csv`
- [ ] **T-25** Implement Excel/CSV parser using `xlsx` npm package; extract rows and headers
- [ ] **T-26** Implement column auto-detection (case-insensitive header matching to expected schema)
- [ ] **T-27** Build column mapping UI step (dropdowns per expected field) for when headers don't match
- [ ] **T-28** Implement email validation pass over all rows; flag invalid with warning badge
- [ ] **T-29** Implement global duplicate detection query against `Contact` table; hard-block duplicates
- [ ] **T-30** Build contact review table (Shadcn/ui `Table`) with per-row checkboxes; show import summary (total / invalid / duplicates)
- [ ] **T-31** On confirm: persist valid, checked contacts to `Contact` table associated with campaign

---

## Phase 4 — Campaign Builder (URL State)

- [ ] **T-32** Create `/app/(dashboard)/campaigns/new/page.tsx` — reads `?step=` and `?campaignId=` from URL
- [ ] **T-33** Step 0 (`?step=name`): campaign name input; on submit, create `Campaign` record in DB (status: `draft`), redirect to `?step=import&campaignId=xxx`
- [ ] **T-34** Step 1 (`?step=import`): embed contact import flow (T-23 to T-31); on confirm, redirect to `?step=template&stepIndex=0&campaignId=xxx`
- [ ] **T-35** Step 2–4 (`?step=template&stepIndex=0/1/2`): build template editor per step
  - Subject field (supports `{{variables}}`)
  - Rich text editor for email body (use `@tiptap/react` or Shadcn-compatible alternative)
  - Variable picker chips: `{{first_name}}`, `{{company_name}}`, `{{address}}`, `{{lead_type}}`, `{{surface_area}}`
  - Preview mode: resolve variables from first contact in list
  - Save `SequenceStep` row to DB on "Volgende" click
- [ ] **T-36** Sequence config per follow-up step: business-day delay input, "geen antwoord" condition checkbox, "geopend" condition checkbox with open-tracking warning
- [ ] **T-37** Step 5 (`?step=review`): summary of campaign name, contact count, sequence steps; "Campagne starten" button
- [ ] **T-38** On launch: set `Campaign.status = active`, `Campaign.launched_at = now()`; generate initial `ScheduledSend` rows for Step 0 for all contacts
- [ ] **T-39** Ensure browser back/forward navigation restores correct step from URL and pre-fills saved DB data

---

## Phase 5 — Sending Engine

- [ ] **T-40** Implement `/lib/scheduler.ts` — `nextSendSlot(after, businessDays)` with Mon–Fri check, 08:00–18:00 CET window, ±15 min jitter
- [ ] **T-41** Implement `/lib/gmail.ts` — `sendEmail()` and `sendReply()` using Gmail API v1; store returned `threadId`
- [ ] **T-42** Implement `/lib/outlook.ts` — `sendEmail()` and `sendReply()` using Microsoft Graph; store returned `conversationId`
- [ ] **T-43** Implement `/api/send/route.ts` — processes pending `ScheduledSend` rows; calls correct provider; updates status
- [ ] **T-44** On Step 0 send success: store `thread_id` in `ScheduledSend`; write `EmailEvent (sent)`; update `Contact.status = sent`
- [ ] **T-45** On Step 0 send: schedule FU1 `ScheduledSend` row using `nextSendSlot()`; likewise FU2 after FU1 sends
- [ ] **T-46** Guard: if `thread_id` is null when FU1/FU2 is about to send → abort, log error, set status `failed`
- [ ] **T-47** Configure Supabase `pg_cron` to call `/api/send` every 5 minutes (SQL: `SELECT cron.schedule(...)`)

---

## Phase 6 — Open Tracking

- [ ] **T-48** Implement `/api/track/open/route.ts` — write `EmailEvent (opened)`, return 1×1 transparent GIF, update `Contact.status = opened`
- [ ] **T-49** Inject tracking pixel `<img>` tag at end of every HTML email body in send functions (T-41, T-42)
- [ ] **T-50** Add Shadcn/ui `Alert` (variant: warning) component to all pages showing open metrics: *"Openingsdetectie kan onnauwkeurig zijn vanwege privacyinstellingen van e-mailclients."*

---

## Phase 7 — Reply Detection

- [ ] **T-51** Implement `/api/cron/poll-replies/route.ts`
  - Loop over all active `MailboxConnection` rows
  - Gmail: `threads.get` for each stored `threadId`; check for messages from prospect email
  - Outlook: `GET /me/messages?$filter=conversationId eq '{id}'`
  - On reply: set `Contact.status = replied`; cancel pending `ScheduledSend` rows; insert `Reply` record
- [ ] **T-52** Configure Supabase `pg_cron` to call `/api/cron/poll-replies` every 30 minutes
- [ ] **T-53** Store reply body in `Reply.body_text`; surface in Replies view and lead timeline

---

## Phase 8 — UI Pages

- [ ] **T-54** Build Dashboard (`/app/(dashboard)/page.tsx`): KPI cards (e-mails verstuurd, antwoordpercentage, vergaderingen gepland); campaign table with status badges
- [ ] **T-55** Build Campaign Detail page (`/app/(dashboard)/campaigns/[id]/page.tsx`): contact table, per-contact status badges, Pause/Resume buttons
- [ ] **T-56** Build Lead Detail page (`/app/(dashboard)/campaigns/[id]/contacts/[contactId]/page.tsx`): contact info, activity timeline, "Markeer als vergadering gepland" button
- [ ] **T-57** Build Replies view (`/app/(dashboard)/replies/page.tsx`): sorted list of replies, expand panel with full body
- [ ] **T-58** Build navigation sidebar/header (Flemish labels); active state per route
- [ ] **T-59** Empty states in Flemish for: no campaigns, no contacts, no replies

---

## Phase 9 — Polish & Hardening

- [ ] **T-60** Verify all UI strings are in Flemish; run a string audit across all `.tsx` files
- [ ] **T-61** Add loading skeletons (Shadcn/ui `Skeleton`) on dashboard, contact table, campaign list
- [ ] **T-62** Add error boundaries and error pages (`error.tsx`) in Flemish
- [ ] **T-63** Test duplicate email enforcement end-to-end (import → DB constraint)
- [ ] **T-64** Test OAuth silent refresh for both Gmail and Outlook (simulate expired token)
- [ ] **T-65** Test business-day scheduler edge cases: Friday send → next Monday; public holiday ignored (out of scope)
- [ ] **T-66** Test campaign builder URL state: refresh mid-wizard, back-navigation, direct deep-link
- [ ] **T-67** Verify Supabase `pg_cron` jobs are running (check Supabase dashboard logs)
- [ ] **T-68** Deploy to Vercel Hobby tier; confirm all env vars set in Vercel dashboard
- [ ] **T-69** Smoke test on production: register → connect Gmail → import 3 contacts → launch campaign → verify Step 0 sends

---

## Backlog (V2)

- Bounce/NDR detection
- Unsubscribe / opt-out management
- CRM export (CSV)
- Out-of-office detection
- Financial health indicator (KBO)
- Odoo ERP integration
- Configurable sending window
- Multi-user / team workspace
