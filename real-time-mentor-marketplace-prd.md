# Real-Time Mentor Marketplace PRD (MVP)

## 1) Product Overview

This product connects mentees to mentors for real-time 1:1 help sessions across video, voice, and chat. The MVP emphasizes trust, speed, and transactional reliability:

- OTP-based login and OTP-gated session start
- Structured onboarding for mentees and mentors
- Search and discovery by taxonomy (category/subcategory/language)
- Booking with real-time availability checks (instant + scheduled)
- Fixed-duration sessions with server-side timer and billing
- Payment collection and commission split (platform take rate)

## 2) Scope and Assumptions

- Region: India-first
- Session formats: video, voice, chat (1:1 only in MVP)
- Pricing model: fixed-duration packages (for example: 30/60/90 mins)
- Currency: INR
- Platform commission assumption: 20% of gross booking value
- KYC and advanced tax automation: designed for extension, minimal in MVP

## 3) Goals and Non-Goals

### 3.1 Goals

- Enable users to sign in quickly and securely using OTP.
- Make mentor discovery accurate via category/subcategory/language matching.
- Ensure only currently bookable mentors are shown for requested windows.
- Deliver reliable booking, session start, timer, billing, and payout flow.
- Ship clear cancellation/no-show/refund policies for predictable UX.

### 3.2 Non-Goals (MVP)

- Group sessions (1 mentor : many mentees)
- Subscription bundles and membership programs
- AI-powered personalization/ranking
- In-depth dispute tooling and full compliance automation

## 4) Personas

- **Mentee**: needs quick expert guidance in specific domains/languages.
- **Mentor**: wants to publish expertise, control slots, and monetize time.
- **Platform Ops/Admin**: monitors fraud, payments, disputes, and performance.

## 5) Success Metrics

- OTP success: send-to-verify conversion, average login completion time
- Marketplace funnel: search -> profile view -> booking -> completed session
- Availability quality: % search results that are actually bookable
- Session reliability: start success, reconnect success, completion rate
- Payments reliability: payment success, duplicate charge rate, refund SLA
- Supply health: mentor slot utilization and repeat booking rate

## 6) Functional Requirements

### 6.1 OTP-Based Login

#### Requirements

- User enters phone number and receives OTP.
- OTP validity window: 5 minutes.
- OTP attempts: max 5 verification attempts per OTP issuance.
- Resend cooldown: 30 seconds minimum; hard resend cap per session.
- Daily phone cap and per-IP throttling to reduce abuse.
- OTP stored as hash only (never plaintext).
- Generic error messaging to prevent account enumeration.

#### Acceptance Criteria

- Successful OTP verification issues `access_token` (plus optional refresh token).
- Resending OTP invalidates prior OTP immediately.
- Repeated failed attempts lock verification temporarily with retry-after.

### 6.2 Mentee Onboarding

#### Required Fields

- Name
- Preferred language(s)
- Interest taxonomy:
  - Category
  - Subcategory
  - Language

#### Behavior

- At least one category and one subcategory required.
- Onboarding can be edited later in profile.
- Taxonomy values are normalized IDs, not free text.

### 6.3 Mentor Onboarding

#### Required Fields

- Public profile (name, bio, display language)
- Expertise taxonomy (category/subcategory/language)
- Supported session modalities: video/voice/chat
- Pricing packages in INR (duration + price)
- Availability windows (recurring and/or one-off)
- Time zone

#### Behavior

- Mentor remains non-discoverable until required onboarding is complete.
- Availability updates are versioned to avoid silent slot conflicts.

### 6.4 Mentor Discovery and Search

#### Search Inputs

- Category (required)
- Subcategory (optional but recommended)
- Language (optional filter)
- Booking type (instant/scheduled)
- Requested start time and package duration

#### Result Rules

- Only mentors meeting requested taxonomy are returned.
- Only mentors available for the full package duration are returned.
- Ranking priority:
  1. Taxonomy relevance
  2. Language match
  3. Earliest availability
  4. Deterministic tie-breaker (stable ordering)

### 6.5 Availability Filtering

- Availability is checked against:
  - Mentor calendar slots
  - Existing bookings (confirmed/started)
  - Package duration requirement
- All checks use server-side UTC canonical timestamps.

### 6.6 Booking (Instant + Scheduled)

#### Instant Booking

- Mentee requests immediate booking.
- System finds earliest eligible slot inside lookahead window (for example: next 30 minutes).
- If no slot exists, user receives nearest alternatives.

#### Scheduled Booking

- Mentee selects future time and package.
- System performs final availability check before booking creation.

#### Booking State Machine

`created -> payment_pending -> confirmed -> started -> completed`

Terminal outcomes:

- `cancelled`
- `failed`
- `mentor_no_show`
- `mentee_no_show`

#### Idempotency

- Booking creation and payment capture require idempotency keys.
- Duplicate client retries must not create duplicate bookings or charges.

### 6.7 OTP-Based Session Start

#### Policy (MVP Decision)

- **Both mentor and mentee must validate session-start OTP before timer starts.**

#### Behavior

- OTP generated once booking becomes `confirmed`.
- OTP validity: from 10 minutes before scheduled start to 15 minutes after.
- One OTP re-issue allowed within grace window if not consumed.
- If both validations do not complete inside grace window, booking auto-transitions to no-show policy path.

### 6.8 Session Timer and Billing

#### Policy (MVP Decision)

- Billing is package-based; **full package amount is charged once session starts**.
- Timer source of truth is server timestamps only.
- Timer starts only after dual OTP validation.
- Timer ends at package duration completion or manual end event (whichever is earlier for state tracking; billing remains full package in MVP).

#### Reliability Rules

- Reconnect does not create a second timer.
- Completion event handling is idempotent.
- Session heartbeat is used for operations and observability, not billing authority.

### 6.9 Payments and Commission

#### Collection

- Payment captured at booking confirmation.
- Supported rails in MVP: card and UPI.

#### Split

- Gross amount paid by mentee.
- Platform commission = 20% of gross.
- Mentor net payout = 80% of gross (before taxes/fees outside scope).

#### Settlement

- Mentor payout released after session completion and configurable hold period.
- Refunds debit split participants per platform payout provider capabilities.

#### Financial Logging

- Ledger entries required for:
  - Gross charge
  - Commission amount
  - Mentor net
  - Refund amounts
  - Settlement status

## 7) User Flows

### 7.1 OTP Login Flow

1. User enters phone number.
2. System sends OTP.
3. User enters OTP.
4. System verifies OTP + risk checks.
5. Success: session token issued.
6. Failure: retry or temporary lock after attempt limit.

### 7.2 Mentee Onboarding Flow

1. User logs in via OTP.
2. User selects interests: category, subcategory, language.
3. System validates mandatory fields.
4. Profile saved; user lands on search/discovery.

### 7.3 Mentor Onboarding Flow

1. Mentor logs in via OTP.
2. Mentor sets expertise taxonomy and supported modalities.
3. Mentor configures packages (duration/price).
4. Mentor sets timezone and availability blocks.
5. Mentor publishes profile and becomes discoverable.

### 7.4 Search and Book Flow (Instant)

1. Mentee selects category/subcategory/language + instant booking.
2. System returns only currently available mentors.
3. Mentee selects mentor and package.
4. Booking created and payment captured.
5. Booking status moves to `confirmed`.
6. Session-start OTP generated.

### 7.5 Search and Book Flow (Scheduled)

1. Mentee selects mentor, package, future time.
2. System validates slot and creates booking.
3. Payment is captured.
4. Booking becomes `confirmed`.
5. Session-start OTP prepared for start window.

### 7.6 Session Start and Completion Flow

1. At session window, both users enter session-start OTP.
2. On dual OTP validation, server starts timer and session state `started`.
3. Session runs until package duration ends or manual end.
4. System marks session `completed`.
5. Billing finalization and payout split processing execute once.

## 8) Edge Cases and Handling

### 8.1 OTP and Auth

- OTP not delivered: resend after cooldown; old OTP invalidated.
- Brute-force attempts: temporary lock and risk escalation.
- Abuse by IP/device: progressive throttling and CAPTCHA/escalation hook.
- Reused OTP: reject because OTP is single-use.

### 8.2 Discovery and Availability

- Mentor toggles offline while user checks out: final availability check at booking submit.
- Slot race between two mentees: first successful payment-confirmation locks slot; second gets conflict and alternatives.
- Taxonomy mismatch due to stale client cache: server-side validation enforces canonical IDs.

### 8.3 Booking and Scheduling

- Scheduled time in past: reject.
- Time zone display mismatch: store UTC, render local timezone per user settings.
- Payment success but booking write timeout: idempotent recovery worker reconciles payment and booking state.

### 8.4 Session Start and No-Show

- One party validates OTP, other absent: wait until grace timeout, then apply no-show policy.
- OTP expires pre-start: allow one re-issue in grace; then fail booking.
- Mentor no-show policy (MVP Decision): full refund to mentee + optional platform credit.
- Mentee no-show policy (MVP Decision): booking marked `mentee_no_show`; no refund after grace.

### 8.5 Timer and Billing

- Duplicate start/completion events: dedupe by session event IDs.
- Disconnects mid-session: timer continues server-side.
- Early end:
  - Mentee exits early: full package still charged (MVP decision).
  - Mentor exits early: mark `ended_by_mentor`; trigger partial/full refund workflow per policy.

### 8.6 Payments and Refunds

- Duplicate charge attempts: prevented by idempotency key and gateway reference checks.
- Partial refund failures: retry queue with operator alerting.
- Settlement failure to mentor: mark pending; retry with backoff and notify mentor.

## 9) MVP vs Future Scope

### 9.1 MVP In Scope

- OTP login (phone)
- Mentee onboarding with interests taxonomy
- Mentor onboarding with expertise/pricing/availability
- Search by category/subcategory/language
- Availability-only mentor listing
- Instant and scheduled booking
- Dual OTP session start
- Fixed-duration billing with server timer
- Card/UPI payments with 20% commission split
- Core cancellation/no-show/refund policy

### 9.2 Future Scope

- Per-minute metered billing and overrun pricing
- Ratings, reviews, and trust scoring
- Rich dispute center and evidence workflows
- Subscription plans and wallet/credits
- Group sessions and cohort mentoring
- AI ranking and personalization
- Full KYC/AML automation and GST invoice automation

## 10) Data Model (Conceptual)

- `User(id, phone, role, timezone, status)`
- `MenteeInterest(user_id, category_id, subcategory_id, language_id)`
- `MentorProfile(user_id, bio, modalities, discoverable_status)`
- `MentorExpertise(user_id, category_id, subcategory_id, language_id)`
- `MentorPackage(package_id, mentor_id, duration_minutes, price_inr, active)`
- `MentorAvailability(slot_id, mentor_id, start_utc, end_utc, recurrence_rule, status)`
- `Booking(booking_id, mentee_id, mentor_id, package_id, start_utc, end_utc, status, idempotency_key)`
- `Session(session_id, booking_id, started_at, ended_at, status)`
- `SessionStartOtp(session_id, otp_hash, expires_at, consumed_by_role, consumed_at)`
- `Payment(payment_id, booking_id, gross_amount, currency, gateway_ref, status)`
- `Commission(payment_id, take_rate, platform_amount, mentor_net_amount)`
- `Refund(refund_id, payment_id, amount, reason_code, status)`

## 11) Operational and Compliance Requirements (India-First)

- Retain auditable logs for login attempts, booking state changes, and financial events.
- Support payout-partner compatible split settlement and reconciliation exports.
- Ensure refund and settlement events are traceable per booking/payment IDs.
- Keep compliance extension points for KYC checks and tax document generation.

## 12) Risks and Mitigations

- **OTP delivery reliability risk** -> multi-provider fallback and monitoring by operator/circle.
- **Slot contention and race conditions** -> strict transactional availability lock on confirmation.
- **Payment-booking inconsistency** -> idempotency + reconciliation workers.
- **Session abuse/fraud** -> dual OTP start, no-show policy, anomaly detection hooks.

## 13) Release Readiness Checklist

- OTP throttling and lockout tested
- Availability + booking race conditions tested
- Dual OTP session start tested for all modalities
- Timer/billing idempotency validated under retries
- Commission split + refund ledger reconciliation validated
- Basic observability dashboards enabled (auth, booking, session, payments)

