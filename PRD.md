# PRD.md — SolarScout Outreach Tool (SOT)

**Version:** 1.2 — Final (Gap-Resolved)  
**Date:** April 2026  
**Status:** Ready for Claude Code implementation  
**Release target:** Closed beta (Belgian solar installers)

---

## 1. Overview

SolarScout Outreach Tool (SOT) is a standalone web application that enables solar panel sales reps to run personalized, multi-step cold outreach campaigns to B2B prospects. Users import prospects from an Excel file, build email templates with personalization variables, configure an automated follow-up sequence, and track engagement (sends, opens, replies).

SOT connects to the user's own Gmail or Outlook mailbox for sending and reply detection. It is a fully standalone product — no integration with the SolarScout backend is required at this stage.

---

## 2. Problem Statement

Solar sales reps have high-quality prospect data from SolarScout (company names, rooftop surfaces, contact emails, lead types) but no efficient way to act on it at scale.

Their current pain points:

- **Inefficiency** — Sending personalized emails manually one-by-one is too slow for a 10–30 email/week rhythm.
- **Poor personalization** — Copy-pasting prospect data into email templates is error-prone and inconsistent.
- **No follow-up discipline** — Manual follow-ups are forgotten or unscheduled.
- **No visibility** — Reps don't know who opened an email, who replied, and who ignored all contact.

---

## 3. Target User

**Persona: Solo Solar Sales Rep**

- Works for a small Belgian solar installation company
- Manages their own prospecting pipeline without a CRM
- Sends roughly 10 emails/day, 30/week
- Uses Gmail or Outlook as their business inbox
- Imports prospect data exported from SolarScout as `.xlsx` files
- Single user per application instance — no team management needed

---

## 4. Goals & Success Metrics

### Primary Goal
Enable sales reps to send personalized, automated multi-step outreach campaigns efficiently, with clear engagement visibility.

### v1 Dashboard KPIs
| Metric | Definition |
|---|---|
| Emails sent | Total emails sent per campaign and all-time |
| Reply rate | (Contacts replied / Emails sent) × 100 |
| Meetings booked | Manually marked by the user on the lead page |

### Quality Targets
- < 2 minutes from Excel upload to campaign launch
- Follow-ups send automatically without any manual intervention
- Zero duplicate emails sent to the same contact (enforced across all campaigns)

---

## 5. Core Features

### 5.1 Authentication

- Single-user application: email/password login
- One account per deployment
- No team roles, no billing, no plan gating in v1

### 5.2 Mailbox Connection

- User connects their Gmail or Outlook account via OAuth 2.0
- The connected mailbox is used exclusively for sending emails and detecting replies
- Only one mailbox can be connected at a time in v1
- Providers:
  - **Gmail** via Google Gmail API v1 (OAuth 2.0)
  - **Outlook / Microsoft 365** via Microsoft Graph API v1 (OAuth 2.0)
- Connection status and connected email address visible in Settings
- OAuth token refresh must be handled automatically by the backend (tokens expire; silent refresh is mandatory — see §10, Issue #4)

### 5.3 Contact Import (Excel Upload)

#### Expected Excel schema
| Column | Template variable | Role |
|---|---|---|
| First Name | `{{first_name}}` | Personalization |
| Company Name | `{{company_name}}` | Personalization |
| Email | `{{email}}` | Sending |
| Address | `{{address}}` | Personalization |
| Lead Type | `{{lead_type}}` | Personalization |
| Surface Area | `{{surface_area}}` | Personalization |
| Last Name | *(no variable)* | Stored; shown on lead detail page only |
| Phone Number | *(no variable)* | Stored; shown on lead detail page only |

#### Import flow
1. User uploads `.xlsx` or `.csv` file
2. System detects column headers (case-insensitive matching)
3. If column names don't match the expected schema exactly → show a **column mapping step**: user assigns uploaded columns to the expected fields via dropdowns
4. **Email validation** runs on each row:
   - Syntax check (RFC 5322 format)
   - MX record check (server-side DNS lookup to verify the domain has a mail server)
   - Invalid emails are flagged with a warning badge; user can include or exclude them before confirming
5. **Duplicate detection** — global, across all campaigns:
   - If an email address already exists anywhere in SOT (imported in any prior campaign), the row is **blocked and excluded automatically**
   - The import summary shows how many rows were blocked as duplicates
   - The user cannot override this; duplicates are never imported
6. User lands on a **contact review table** with all valid, non-duplicate rows and a checkbox per row (all checked by default). User unchecks any contacts to exclude before launch.
7. Confirmed contacts are stored persistently, associated with the campaign.
8. **The contact list is locked at campaign launch.** No contacts can be added to or removed from an active or completed campaign.

### 5.4 Campaign Builder

#### State management
Campaign builder state is managed via **URL/query parameters + server state** (no client-side global state store). This means:
- The current step (e.g. `?step=template&stepIndex=0`) is encoded in the URL
- Navigating back/forward via browser history works correctly
- Page refresh does not lose progress — all draft state is persisted to the server (Supabase) on each step completion
- Deep-linking directly to a campaign builder step is supported

#### Campaign object
- Name (required)
- Connected mailbox (auto-filled from authenticated OAuth account)
- Contact list (from import step, locked at launch)
- Email sequence: initial email + up to 2 follow-up steps
- Status: `Draft` → `Active` → `Paused` → `Completed`

#### Campaign lifecycle rules
| Status | Allowed actions |
|---|---|
| `Draft` | Edit name, templates, sequence config, contact list |
| `Active` | Pause campaign; view contacts and timeline; no edits to templates or contacts |
| `Paused` | Resume campaign (queue resumes from where it stopped); view contacts and timeline; no edits |
| `Completed` | Read-only; all steps have been sent or cancelled for all contacts |

- **Pausing** freezes the send queue — no new emails go out until resumed
- **Resuming** restores the queue; pending sends execute according to the original schedule (or immediately if their scheduled time has passed)
- A campaign auto-completes when all contacts have either replied or exhausted all sequence steps

#### Template editor (per sequence step)
- Subject line field (supports variables)
- Email body: rich text editor (HTML output)
- Variable picker: clickable chips to insert `{{first_name}}`, `{{company_name}}`, `{{address}}`, `{{lead_type}}`, `{{surface_area}}`
- Preview mode: renders a fully resolved email using real data from the first contact in the list
- At send time, SOT automatically generates a plain-text fallback from the HTML body for multipart MIME compliance

#### Sequence configuration

**Step 0 — Initial email**
- Sends when the campaign is launched, according to the sending window

**Step 1 — Follow-up 1**
- Delay: user sets a number of **business days** after Step 0 (UI label: "business days"; default: 3)
- Condition: send only if contact has NOT replied
- Optional condition (checkbox): "Send only if the initial email was opened"
  > ⚠️ This condition depends on open tracking, which is unreliable. Display warning: *"Open detection may be inaccurate due to email client privacy features."*

**Step 2 — Follow-up 2**
- Delay: user sets a number of **business days** after Step 1 (UI label: "business days"; default: 5)
- Condition: send only if contact has NOT replied
- Optional condition (checkbox): "Send only if Follow-up 1 was opened"
  > ⚠️ Same open tracking caveat applies.

**Global rules:**
- All follow-up step delays are calculated in **business days** (Monday–Friday). Weekends are skipped. The UI labels all delay inputs as "business days."
- When a reply is detected for a contact, all pending follow-up steps for that contact are immediately cancelled.
- All follow-up steps are sent as replies within the same email thread as Step 0, so the recipient sees the full conversation. The `threadId` (Gmail) or `conversationId` (Outlook) from Step 0 must be stored per contact and reused for all subsequent steps.

#### Sending rules
- No enforced daily send cap in v1
- Emails send on **weekdays only** (Monday–Friday)
- Sending window: **08:00–18:00 CET** (fixed; no user configuration)
- A randomized jitter of ±15 minutes is applied to each scheduled send to avoid bot-like traffic patterns
- "From" name and email address come from the authenticated OAuth account

### 5.5 Tracking & Status Management

#### Per-contact status within a campaign
| Status | Triggered by |
|---|---|
| `Not contacted` | Default on import |
| `Email sent` | Email successfully submitted to Gmail/Outlook API |
| `Opened` | Tracking pixel loaded by recipient's email client |
| `Replied` | Reply detected in connected mailbox thread |

> **Note — "Delivered" status not in v1:** Reliable delivery confirmation requires parsing NDR/DSN bounce messages, which is complex. "Email sent" means successfully submitted to the API. Bounce detection is deferred to v2.

#### Open tracking
- A 1×1 transparent tracking pixel is injected into the HTML body of every outgoing email at send time
- Pixel requests hit the SOT backend endpoint `/api/track/open?cid={contact_id}&step={step_index}`, which logs `(contact_id, step_index, timestamp)` as an open event
- **Known limitation:** Apple Mail Privacy Protection, corporate email proxies, and Outlook Safe Links pre-load images, making open signals unreliable. The UI must display a persistent notice wherever open data appears: *"Open tracking may be inaccurate due to email client privacy features."*
- Emails must be sent as HTML (`text/html` part of multipart MIME) for pixel injection to work

#### Reply detection
- The backend polls the connected mailbox every **30 minutes** using a Supabase Edge Function triggered via `pg_cron` (free tier compatible — no Vercel account required):
  - Gmail API: `threads.get` on stored `threadId`, check for messages from the prospect's email address
  - Graph API: `GET /me/messages?$filter=conversationId eq '{id}'`
- On reply detection:
  - Contact status → `Replied`
  - All pending `ScheduledSend` entries for that contact → status set to `cancelled`
  - Reply body stored in SOT database and surfaced in the Replies view and lead timeline

> **Deployment note:** The application is deployed on **Vercel's free (Hobby) tier**. Cron jobs are therefore handled via **Supabase `pg_cron`** (available on Supabase free tier) calling the Next.js API route, rather than Vercel Cron. The 30-minute polling frequency has negligible cost impact and is acceptable for v1 reply latency requirements.

### 5.6 Replies View

- Dedicated **"Replies"** tab in the navigation
- Lists all detected replies, sorted by most recent first
- Each row shows: sender name, company name, campaign name, reply date, reply snippet
- Clicking a reply expands a read-only panel with the full reply body
- No compose/reply functionality inside SOT — user replies directly from their Gmail or Outlook inbox

### 5.7 Lead Detail Page & Timeline

Each contact has a dedicated detail page:

**Contact info section**
- First name, Last name, Company name, Email, Phone number
- Address, Lead type, Surface area
- Current campaign status badge

**Activity timeline** (chronological, oldest → newest)
| Event | Info displayed |
|---|---|
| Email sent (Step 0 / Follow-up 1 / Follow-up 2) | Step label, subject line, sent timestamp |
| Email opened | Step label, timestamp + unreliability disclaimer |
| Reply received | Timestamp, full reply body |
| Meeting booked | Timestamp |

**Meeting booking action**
- "Mark as Meeting Booked" button on the lead page
- Records a `meeting_booked` event on the timeline
- Increments the meetings booked counter in the dashboard
- Button changes to "Meeting Booked ✓" after marking (idempotent; cannot unmark in v1)

### 5.8 Dashboard & Analytics

**Top-level KPIs** (all-time, plus filterable by campaign)
- Emails sent (total)
- Reply rate (%)
- Meetings booked (count)

**Campaign table**
- One row per campaign
- Columns: name, status, total contacts, sent, opened, replied, meetings booked
- Clicking a campaign row opens its contact list with individual status badges

No team-level analytics. No engagement-based contact filtering.

---

## 6. Key User Flows

### Flow 1 — First-time setup
1. Register → log in
2. Connect Gmail or Outlook via OAuth (Settings page)
3. Land on empty dashboard with "New Campaign" CTA

### Flow 2 — Launch a campaign
1. Click **"New Campaign"** → enter campaign name
2. Upload Excel file → column mapping (if needed) → email validation → duplicate detection → contact review with checkboxes → confirm import
3. Build Step 0 template (subject + body with variables) → preview with real contact data
4. Configure Follow-up 1: delay in business days, condition (no reply / opened), build template → preview
5. Configure Follow-up 2 (optional): same as above
6. Review campaign summary → click **"Launch Campaign"**
7. Step 0 emails enter the send queue; follow-ups schedule automatically based on business-day delays

### Flow 3 — Pause and resume a campaign
1. Open an active campaign
2. Click **"Pause Campaign"** — send queue freezes, no emails go out
3. Click **"Resume Campaign"** — queue restores; overdue sends execute at next available sending window

### Flow 4 — Monitor a running campaign
1. Open a campaign from the dashboard
2. See contact table with live status badges
3. Click any contact → view full activity timeline
4. Click "Replies" tab in the nav to read incoming replies

### Flow 5 — Record a meeting
1. Open a contact's detail page
2. Click **"Mark as Meeting Booked"**
3. Timeline records the event; dashboard counter increments

---

## 7. Data Model (Conceptual)

```
User
  id, email, password_hash, created_at

MailboxConnection
  id, user_id, provider (gmail | outlook), access_token, refresh_token,
  email_address, token_expires_at, connected_at

Campaign
  id, user_id, name, status (draft | active | paused | completed),
  created_at, launched_at, completed_at

SequenceStep
  id, campaign_id, step_index (0 | 1 | 2), subject, body_html,
  delay_business_days, condition_open_required (bool)

Contact
  id, campaign_id, first_name, last_name, company_name, email, phone,
  address, lead_type, surface_area,
  status (not_contacted | sent | opened | replied),
  email_valid (bool), meeting_booked (bool),
  created_at

ScheduledSend
  id, contact_id, step_index, scheduled_at, sent_at,
  status (pending | sent | cancelled),
  thread_id    -- Gmail threadId or Outlook conversationId

EmailEvent
  id, contact_id, step_index, event_type (sent | opened | replied),
  timestamp, message_id

Reply
  id, contact_id, received_at, body_text, raw_message_id
```

**Duplicate enforcement:** Before inserting a new Contact row, check that `email` does not already exist in the `Contact` table (any campaign). If it does, reject the row during import — it is never inserted.

---

## 8. Technical Architecture

> Claude Code must use this stack exactly. It is selected for rapid iteration, managed infrastructure, and suitability for a small beta.

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind CSS | Full-stack framework |
| UI components | **Shadcn/ui** | Pre-built accessible components; extend with Tailwind |
| UI language | **Flemish (Dutch/nl-BE)** | All UI labels, buttons, error messages, and copy in Flemish |
| Backend | Next.js API Routes (Node.js) | Co-located with frontend |
| Database + Auth | Supabase (PostgreSQL + Auth) | Managed DB, built-in auth |
| Campaign builder state | **URL/query params + server state** | Step encoded in URL; draft persisted to Supabase on each step |
| Gmail sending | Gmail API v1 — `messages.send` | OAuth 2.0, thread support via `threadId` |
| Outlook sending | Microsoft Graph API v1 — `sendMail` | OAuth 2.0, thread via `conversationId` |
| Open tracking pixel | Next.js API route `/api/track/open` | No external dependency |
| Reply polling | **Supabase `pg_cron`** → `/api/cron/poll-replies` | Every 30 min; free tier; no Vercel account required |
| Business-day scheduling | Custom utility in the backend | Skip Sat/Sun; respect 08:00–18:00 CET |
| Email validation | Syntax: built-in regex; MX: `dns.promises.resolveMx` | No paid API needed |
| Deployment | **Vercel Hobby (free tier)** | No Vercel account upgrade needed for this setup |

---

## 9. Out of Scope — V1

- SolarScout backend or URL integration
- AI-generated email content
- Click tracking
- Bounce detection (hard / soft)
- Unsubscribe link / opt-out management
- Out-of-office auto-reply detection
- Reply outcome classification (interested / not interested / etc.)
- "Do not contact" lists
- Team workspaces or multi-user support
- Inbox warm-up / sending limits / deliverability warnings (SPF/DKIM/DMARC)
- Calendar or CRM integration for meeting booking (meetings booked is manual)
- Mobile app
- Multiple simultaneous mailbox connections
- Configurable sending time windows
- Adding contacts to an active campaign after launch

---

## 10. Flagged Issues & Decisions

| # | Issue | Severity | Decision |
|---|---|---|---|
| 1 | **"Delivered" status removed** | Medium | Reliable delivery confirmation requires NDR/DSN parsing. Removed from v1. "Email sent" = submitted to API. Bounce detection is v2. |
| 2 | **"Meetings booked" is manual** | Low | One-click button on lead page. Counter is user-reported. No calendar integration. Cannot be unmarked in v1. |
| 3 | **Open tracking unreliability** | Medium | Apple Mail, corporate proxies, and Outlook Safe Links pre-load or block pixels. Open data is directional. Show a persistent UI warning wherever open rate figures appear. |
| 4 | **OAuth token expiry** | High | Gmail and Outlook tokens expire (≈1 hour). Silent background refresh using `refresh_token` is mandatory from day one. A failed refresh must surface clearly in Settings with a "Reconnect" prompt. No emails can send with an expired token. |
| 5 | **Thread continuity (threadId storage)** | High | `threadId` / `conversationId` is returned by the API after Step 0 sends. Must be stored immediately in `ScheduledSend`. If missing, Follow-up 1 and 2 cannot be threaded and must error rather than send as new threads. |
| 6 | **"Open-based" condition + unreliable open data** | Medium | Warn the user in the campaign builder next to this checkbox. The condition is best-effort. |
| 7 | **Reply polling latency** | Low | 30-min polling means a follow-up could theoretically send just before a reply is detected. Acceptable for v1. |
| 8 | **Business-day scheduler** | Medium | The backend must implement a correct business-day calculation utility (skip Sat/Sun; Belgian public holidays out of scope). All delay inputs in the UI are labelled "business days." |
| 9 | **Duplicate detection is hard-blocking** | Low | Duplicates are silently excluded at import; user sees a count in the import summary. No override allowed. |
| 10 | **Contact list locked at launch** | Low | After a campaign moves from `Draft` to `Active`, the contact list is immutable. Any new contacts require a new campaign. |
| 11 | **Pausing resume logic** | Medium | On resume, any `ScheduledSend` with `scheduled_at` in the past and status `pending` should send at the next available slot within the 08:00–18:00 CET window, not immediately (to avoid burst sends). |
| 12 | **GDPR / compliance** | Low (closed beta) | Belgium B2B use only, no compliance requirements for closed beta. Unsubscribe, opt-out, and audit logging must be addressed before any public or commercial launch. |
| 13 | **Vercel Hobby / no cron** | Low | Vercel Hobby tier does not support Vercel Cron. Reply polling is handled via Supabase `pg_cron` (free tier) calling the Next.js `/api/cron/poll-replies` endpoint. Impact: identical 30-min polling; no additional cost. |
