# FitPay — Claude Code Project Memory

## What This Project Is
FitPay is a PT (personal trainer) client management and payment platform built for the
Moolre Startup Cup 2026. It is a real product — the trainer is an active certified PT in
Accra, Ghana with real clients. The platform manages session bookings, payments, workout
progression, and client communication.

Submission deadline: **July 13, 2026.**

---

## Tech Stack — Non-Negotiable

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | One codebase, SSR, API routes built in |
| Styling | Tailwind CSS | Speed |
| Database | Supabase (PostgreSQL) | Auth + DB + RLS + pg_cron built in |
| ORM | Supabase JS client | No Prisma — too much overhead for timeline |
| Payments | Moolre APIs | Competition requirement |
| AI | Anthropic Claude API | Selective triggers only |
| Deployment | Vercel | Next.js native |

---

## Absolute Rules — Never Break These

### Copy & Content Style
- **Never use em dashes (—) or hyphens-as-punctuation in any user-facing
  content**: UI copy, marketing pages, pitch decks, video scripts, email
  templates, SMS messages, or media assets. Rewrite with commas, periods,
  colons, or the word "and" instead.

### Framework
- **App Router only.** Never use Pages Router patterns.
- API routes live in `/app/api/[route]/route.ts`
- Server components by default. Use `'use client'` only when necessary (forms, interactivity).
- Never mix App Router and Pages Router patterns in the same file or import.

### Security
- **All Moolre API calls are server-side only.** Never call Moolre from a client component.
- **Never expose API keys client-side.** No `NEXT_PUBLIC_` prefix on secret keys.
- Only these env vars are public (prefixed `NEXT_PUBLIC_`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- All other env vars are server-only: `MOOLRE_API_KEY`, `MOOLRE_API_USER`, `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Moolre API
- **Claude has no training data on Moolre APIs.** Before writing any Moolre integration,
  the relevant API docs section must be in context. Never assume endpoint structure.
- Base URL (live): `https://api.moolre.com`
- Base URL (sandbox): `https://sandbox.moolre.com`
- Auth headers on every request: `X-API-USER`, `X-API-KEY`
- All responses follow: `{ status, code, message, data, go }`
- Always check `status === 1` for success, not HTTP status code alone.
- Always use sandbox during development. Never hit live API during builds.

### Webhooks
- **All webhook handlers must be idempotent.**
- Pattern: receive webhook → extract `moolre_ref` → check if `moolre_ref` already exists
  in DB → if yes, return `200` and exit immediately → if no, process and insert.
- Never process a webhook without this check. Moolre retries on network failure.
- Always return HTTP `200` to Moolre even on handled duplicates.

### Supabase / Database
- **Every table must have Row-Level Security (RLS) enabled.**
- After creating any table, immediately write its RLS policies before moving on.
- RLS rules:
  - `users`: users can only read/update their own row
  - `purchases`: clients see only their own; trainers see all
  - `sessions`: clients see only their own; trainers see all
  - `workout_logs`: clients see only their own; trainers see all
  - `progression_rules`: clients see only their own; trainers see all
  - `disbursements`: trainer only
  - `ussd_sessions`: service role only (server-side)
- Never use `supabase.from(table)` on the client with service role key.
- Client-side Supabase uses anon key + RLS. Server-side uses service role key.

### SMS / Cron
- **Scheduled SMS reminders use Supabase `pg_cron`, not Vercel crons.**
- Vercel free tier has cron limitations. pg_cron runs inside the database.
- SMS is sent via Moolre SMS API from a `/app/api/sms/send/route.ts` endpoint
  that pg_cron triggers via a database function + HTTP extension.

### USSD
- Moolre provisions the shortcode — no telco setup needed.
- **The live FitPay dial code is `*919*4012#`. This is the ONLY correct code —
  never use any other code in UI copy, marketing pages, or media assets.**
- USSD callback endpoint: `/app/api/ussd/callback/route.ts`
- This endpoint must respond within **5 seconds** or the session dies.
- USSD session state is stored in the `ussd_sessions` table with a short TTL (180s).
- Every menu step must handle:
  - Valid input (happy path)
  - Invalid input (non-numeric, out-of-range) → re-show same menu with error
  - `0` to go back → restore previous menu state
  - Session timeout → clean exit message
- Never assume the user will input valid data. Validate everything.
- USSD menu responses use `CON` prefix to continue session, `END` to terminate.

### AI / Claude
- **The rules engine handles ALL session-to-session workout progression. Claude is never
  called for routine next-session plan generation. This is non-negotiable.**
- Claude fires only on these 4 triggers:
  1. New client onboarding → generate personalised starter plan (once per client)
  2. Every 4th completed session → generate narrative progress report (sent via WhatsApp)
  3. Injury flag raised → restructure upcoming plan from session history
  4. Monthly batch → draft personalised check-in messages for all active clients
- Claude API calls live in `/app/api/ai/[trigger]/route.ts`
- Always include the full relevant session history in the Claude prompt context.
- Cap `max_tokens` appropriately per trigger (progress report: 500, plan: 800).
- Handle Claude API errors gracefully — if Claude is unavailable, queue the task,
  do not break the user flow.

---

## Directory Structure

```
fitpay/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (client)/          # Client portal — mobile-first
│   │   ├── dashboard/
│   │   ├── book/
│   │   ├── packages/
│   │   ├── progress/
│   │   └── plan/
│   ├── (trainer)/         # Trainer dashboard
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── sessions/
│   │   ├── log/
│   │   └── earnings/
│   └── api/
│       ├── webhooks/
│       │   └── moolre/    # Payment webhook — idempotent
│       ├── ussd/
│       │   └── callback/  # USSD session handler
│       ├── payments/
│       │   ├── initiate/
│       │   └── status/
│       ├── disbursements/
│       │   ├── withdraw/
│       │   └── refund/
│       ├── sms/
│       │   └── send/
│       ├── sessions/
│       │   ├── book/
│       │   ├── complete/
│       │   └── cancel/
│       ├── engine/
│       │   └── progress/  # Rules engine — post-session trigger
│       └── ai/
│           ├── onboard/
│           ├── report/
│           ├── adapt/
│           └── checkin/
├── lib/
│   ├── moolre.ts          # Moolre API client (server-only)
│   ├── supabase/
│   │   ├── client.ts      # Browser client (anon key)
│   │   └── server.ts      # Server client (service role)
│   ├── engine/
│   │   └── progression.ts # Workout rules engine
│   └── ai/
│       └── claude.ts      # Claude API wrapper (server-only)
├── types/
│   └── index.ts           # Shared TypeScript types
├── middleware.ts           # Auth protection via Supabase
└── CLAUDE.md              # This file
```

---

## Database Schema

### `users`
```sql
id uuid PK
name text NOT NULL
phone text UNIQUE NOT NULL
email text UNIQUE
role enum('client', 'trainer') NOT NULL
goal enum('weight_loss', 'strength', 'endurance', 'general')
fitness_level enum('beginner', 'intermediate', 'advanced')
created_at timestamp DEFAULT now()
```

### `packages`
```sql
id uuid PK
name text NOT NULL
sessions int NOT NULL
price_ghs decimal NOT NULL
duration_days int NOT NULL
is_active bool DEFAULT true
```

### `purchases`
```sql
id uuid PK
client_id uuid FK → users
package_id uuid FK → packages
moolre_ref text UNIQUE NOT NULL   -- idempotency key
status enum('pending', 'active', 'expired', 'refunded')
sessions_left int NOT NULL
expires_at timestamp
created_at timestamp DEFAULT now()
```

### `sessions`
```sql
id uuid PK
client_id uuid FK → users
trainer_id uuid FK → users
purchase_id uuid FK → purchases
scheduled_at timestamp NOT NULL
status enum('scheduled', 'completed', 'cancelled', 'no_show')
notes text
created_at timestamp DEFAULT now()
```

### `workout_logs`
```sql
id uuid PK
session_id uuid FK → sessions UNIQUE
exercises jsonb NOT NULL  -- array of {name, sets, reps, weight_kg, difficulty}
overall_difficulty enum('easy', 'moderate', 'hard')
injury_flag bool DEFAULT false
injury_notes text
next_plan jsonb           -- generated by rules engine
ai_generated bool DEFAULT false
created_at timestamp DEFAULT now()
```

### `progression_rules`
```sql
id uuid PK
client_id uuid FK → users UNIQUE
goal enum NOT NULL
current_phase text
sessions_in_phase int DEFAULT 0
deload_every_n int DEFAULT 4
last_updated timestamp DEFAULT now()
```

### `disbursements`
```sql
id uuid PK
trainer_id uuid FK → users
amount_ghs decimal NOT NULL
type enum('withdrawal', 'refund')
recipient_phone text NOT NULL
moolre_ref text UNIQUE
status enum('pending', 'success', 'failed')
created_at timestamp DEFAULT now()
```

### `ussd_sessions`
```sql
session_id text PK            -- Moolre session ID
phone text NOT NULL
client_id uuid FK → users     -- nullable until identified
current_state text NOT NULL
session_data jsonb DEFAULT '{}'
expires_at timestamp NOT NULL
created_at timestamp DEFAULT now()
```

---

## exercise_entry Schema (enforced in app layer)
```typescript
type ExerciseEntry = {
  name: string         // e.g. "Barbell Squat"
  sets: number
  reps: number
  weight_kg: number    // 0 for bodyweight
  difficulty: 'easy' | 'moderate' | 'hard'
  notes?: string
}
```
This schema must be consistent across all workout_logs entries.
The rules engine queries this shape. Never store free-form exercise text.

---

## Rules Engine Logic (progression.ts)

The rules engine runs after every session is marked complete.
It reads the last workout_log and outputs the next session plan as `ExerciseEntry[]`.

```
INPUTS: client_id, last_workout_log, progression_rules

LOGIC:
1. Check sessions_in_phase against deload_every_n
   - If sessions_in_phase >= deload_every_n → generate deload session (reduce all weights 40%, same movements)
   - Else → continue progression

2. For each exercise in last session:
   - If difficulty === 'easy' → increase reps by 2 OR weight by 2.5kg (based on goal)
   - If difficulty === 'moderate' → keep same weight/reps
   - If difficulty === 'hard' → decrease reps by 1 (hold weight)

3. Muscle group rotation:
   - Never schedule same primary muscle group on consecutive sessions
   - Rotate: Push → Pull → Legs → Full Body (or goal-specific pattern)

4. Goal routing:
   - weight_loss → compound movements + higher reps (12-15) + cardio finisher
   - strength → lower reps (4-6) + heavier compound focus
   - endurance → moderate weight + high reps (15-20) + circuit style
   - general → balanced mix

OUTPUT: next_plan jsonb (array of ExerciseEntry), update progression_rules
```

Claude is NEVER called in this function. This runs free on every session completion.

---

## Claude Trigger Contexts

### 1. Onboarding (`/api/ai/onboard`)
Fires once when a new client completes signup.
Prompt must include: goal, fitness_level, any injuries noted, available days per week.
Output: initial 4-session plan as structured JSON.

### 2. Progress Report (`/api/ai/report`)
Fires when `sessions_in_phase` hits a multiple of 4.
Prompt must include: last 4 workout_logs (full exercise data), client goal, progression_rules.
Output: narrative paragraph (not a plan) — what improved, what to focus on.
Delivered via: Moolre WhatsApp API.

### 3. Injury Adaptation (`/api/ai/adapt`)
Fires when `injury_flag = true` on a workout_log.
Prompt must include: injury_notes, last 3 workout_logs, current progression_rules.
Output: modified next 2-session plan avoiding injured area.

### 4. Monthly Check-in (`/api/ai/checkin`)
Fires via pg_cron on 1st of each month for all active clients.
Prompt must include: client name, goal, sessions completed this month, progress trend.
Output: short personalised SMS message (max 160 chars).
Delivered via: Moolre SMS API.

---

## Moolre API Reference (paste full docs before implementing)

### Collections
- Initiate payment: `POST /payment/initiate`
- Payment status: `POST /payment/status`
- Webhook: Moolre POSTs to your `/api/webhooks/moolre` on status change

### Disbursements
- Initiate transfer: `POST /transfer/initiate`
- Transfer status: `POST /transfer/status`

### SMS
- Send SMS: `POST /sms/send`
- Required fields: `to`, `message`, `sender_id`

### USSD
- Register callback URL in Moolre dashboard
- Moolre POSTs to your `/api/ussd/callback` on each user input
- Your response must be JSON with `session_operation` (continue/end) and `session_msg`
- Respond within 5 seconds

**Always paste the actual Moolre docs into context before implementing any of the above.**

---

## USSD Menu State Map

```
START
└── main_menu
    ├── 1 → book_session
    │   ├── show_slots → confirm_slot → BOOK → END (+ SMS confirmation)
    │   └── 0 → main_menu
    ├── 2 → view_plan
    │   └── show next session from rules engine → END
    ├── 3 → pay_sessions
    │   ├── show_packages → select_package → initiate_collections → END
    │   └── 0 → main_menu
    ├── 4 → session_balance
    │   └── show sessions_left → END
    └── 0 → EXIT
```

Invalid input at any step → re-display current menu with "Invalid option. Try again."

---

## Environment Variables

```bash
# Public (client-safe)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-only (never expose)
SUPABASE_SERVICE_ROLE_KEY=
MOOLRE_API_USER=
MOOLRE_API_KEY=
MOOLRE_SANDBOX_API_USER=
MOOLRE_SANDBOX_API_KEY=
ANTHROPIC_API_KEY=
MOOLRE_WEBHOOK_SECRET=

# Config
NEXT_PUBLIC_APP_URL=https://fitpay.dev
USE_SANDBOX=true   # flip to false for demo/production
```

**Production domain: `https://fitpay.dev`** (registered via Vercel, required by the
Moolre Startup Cup organisers — no free/default `.vercel.app` submission URL).
Connected in Vercel Domains, `NEXT_PUBLIC_APP_URL` set accordingly, and the
Supabase Auth redirect URLs and the `monthly-client-checkin` pg_cron job both
point at it.

---

## Environments

| Environment | Supabase Project | Moolre | Purpose |
|---|---|---|---|
| development | fitpay-dev | Sandbox | Daily building |
| demo | fitpay-demo | Sandbox | Competition pitch |
| production | fitpay-prod | Live | Post-competition |

Never use the live Moolre API keys during development.
The demo environment should have clean, realistic data — not dev test data.

---

## Key Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| Mobile app vs web | Responsive Next.js web app | One codebase, no install friction, bookmarkable |
| Workout AI vs rules | Rules engine for every session, Claude for milestones | Cost, reliability, scalability |
| Prisma vs Supabase client | Supabase JS client | Speed, RLS, less setup overhead |
| Vercel cron vs pg_cron | pg_cron | Vercel free tier limitations, runs inside DB |
| React Native vs Next.js | Next.js | 6-week timeline, single codebase |
| Co-trainer payouts vs withdrawals | Trainer withdrawal + client refunds | Authentic — Nii is solo PT |

---

## Known Gaps - Raise At Next Critique

These are real, acknowledged limitations left for post-launch on purpose. Do not build fixes
for these unless explicitly asked. Bring both of these up the next time the user asks for a
critique of the app.

1. **No 1% commission mechanism exists yet.** There is no client-count gating, no fee
   calculation, no ledger entry, and no destination account for platform revenue anywhere in
   the codebase. The landing page states "FitPay takes 1% per transaction" but nothing
   collects it. This is intentional for the competition timeline, not an oversight.

2. **Single pooled Moolre account, no real fund segregation.** All collections and
   disbursements for every trainer flow through one `MOOLRE_ACCOUNT_NUMBER`. Per-trainer
   balances are tracked only as an internal ledger in the app database (purchases minus
   disbursements per `trainer_id`), not as provider-level separated funds. This matches
   Moolre's standard API and the current single-trainer reality, but at multi-trainer scale
   it means shared exposure to freezes, disputes, or float shortages, and trust concentration
   on the app's own bookkeeping rather than any provider-level guarantee.

---

## What Claude Code Must NOT Do

- Do not call Moolre APIs from client components
- Do not skip RLS policies on any table
- Do not generate next-session workout plans using Claude AI
- Do not use Pages Router patterns
- Do not put secret keys in NEXT_PUBLIC_ env vars
- Do not write non-idempotent webhook handlers
- Do not use Vercel crons for SMS scheduling
- Do not store exercises as free-form text — always use ExerciseEntry schema
- Do not seed demo data into the development database
- Do not assume Moolre API structure — always work from pasted docs
