# Mentor Marketplace System Flows

This document defines detailed system flows for:

1. OTP authentication
2. Mentor discovery
3. Booking (instant vs scheduled)
4. OTP session validation
5. Session billing
6. Payment and payout

It includes sequence diagrams (Mermaid text form), failure scenarios, and retry logic for each.

---

## 1) OTP Authentication

### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant UA as User App
    participant API as API Gateway
    participant AUTH as Auth Service
    participant RL as Rate Limit (Redis)
    participant DB as PostgreSQL
    participant OTP as OTP Provider
    participant TOK as Token Service

    UA->>API: POST /auth/otp/send (phone, countryCode, deviceId)
    API->>AUTH: Validate input
    AUTH->>RL: Check phone/IP/device throttles
    RL-->>AUTH: Allowed / Blocked
    alt Allowed
        AUTH->>DB: Insert otp_session (purpose=login, hash, expires_at)
        AUTH->>OTP: Send OTP
        OTP-->>AUTH: Accepted / Failed
        AUTH-->>UA: otpRequestId, expiresAt, resendAfterSeconds
    else Blocked
        AUTH-->>UA: 429 Too Many Requests
    end

    UA->>API: POST /auth/otp/verify (otpRequestId, otpCode, deviceId)
    API->>AUTH: Verify request
    AUTH->>DB: Select otp_session FOR UPDATE
    AUTH->>AUTH: Validate hash, expiry, attempts
    alt OTP valid
        AUTH->>DB: Mark verified + upsert user
        AUTH->>TOK: Issue JWT(s)
        TOK-->>AUTH: access/refresh tokens
        AUTH-->>UA: 200 tokens + user summary
    else OTP invalid/expired/locked
        AUTH->>DB: Increment attempts / mark expired/locked
        AUTH-->>UA: 4xx error
    end
```

### Failure Scenarios

- OTP send exceeds per-phone/IP/device/day caps -> return `429` with `retry_after`.
- OTP provider send failure or timeout -> attempt provider fallback, else `503`.
- OTP expired before verify -> return `400 OTP_EXPIRED`.
- Exceeded max verify attempts -> OTP session moves to `locked`; reject further attempts.
- OTP replay (already consumed) -> reject with `OTP_ALREADY_USED`.
- Concurrent verify requests -> DB row lock ensures only one success path.

### Retry Logic

- Send OTP: one immediate retry + optional fallback provider.
- Verify OTP: safe to retry; bounded by `max_attempts`.
- Resend OTP: enforce cooldown (for example 30s), invalidate prior active OTP.
- Client timeout retries should reuse same `otpRequestId` for verification.

---

## 2) Mentor Discovery

### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant MA as Mentee App
    participant API as API Gateway
    participant SEARCH as Search Service
    participant CACHE as Cache
    participant DB as PostgreSQL

    MA->>API: GET /mentors/search?categoryId&subcategoryId&language&startTime&duration
    API->>SEARCH: Normalized search request
    SEARCH->>CACHE: Fetch taxonomy metadata/ranking weights
    CACHE-->>SEARCH: Cache hit/miss
    SEARCH->>DB: Filter discoverable mentors by taxonomy
    SEARCH->>DB: Filter availability for requested duration
    SEARCH->>DB: Exclude mentors with conflicting active bookings
    SEARCH->>SEARCH: Rank (taxonomy > language > earliest slot > stable tie-break)
    SEARCH-->>MA: Paginated results
```

### Failure Scenarios

- Invalid taxonomy IDs / invalid duration -> `422 validation_error`.
- Query timeouts due to broad scans -> return partial failure or `503`.
- Cache unavailable -> fall back to DB computation.
- Availability drift (slot taken after search) -> booking flow handles final conflict with `409`.

### Retry Logic

- Read-only search is safe for client retries.
- On cache miss/failure, compute from DB and repopulate cache asynchronously.
- On DB timeout, one short retry with lower page size.
- Use deterministic sorting + cursor/keyset pagination to keep retries stable.

---

## 3) Booking (Instant vs Scheduled)

### 3.1 Instant Booking Sequence

```mermaid
sequenceDiagram
    autonumber
    participant MA as Mentee App
    participant API as API Gateway
    participant BOOK as Booking Service
    participant AV as Availability Engine
    participant PAY as Payment Service
    participant DB as PostgreSQL
    participant Q as Queue

    MA->>API: POST /bookings (instant, mentorId, packageId, Idempotency-Key)
    API->>BOOK: Create booking request
    BOOK->>DB: Check idempotency key (mentee scoped)
    alt Duplicate key found
        BOOK-->>MA: Return previously created booking
    else New request
        BOOK->>AV: Find earliest valid slot in lookahead window
        AV->>DB: Lock slot + verify conflict-free
        BOOK->>DB: Insert booking (payment_pending)
        BOOK->>PAY: Capture payment (idempotent)
        PAY-->>BOOK: captured / failed / pending
        alt captured
            BOOK->>DB: booking -> confirmed
            BOOK->>Q: Enqueue session OTP issuance
            BOOK-->>MA: 201 confirmed booking
        else failed
            BOOK->>DB: booking -> failed
            BOOK-->>MA: 402/409 failure response
        else pending
            BOOK->>DB: keep payment_pending
            BOOK-->>MA: 202 pending state
        end
    end
```

### 3.2 Scheduled Booking Sequence

```mermaid
sequenceDiagram
    autonumber
    participant MA as Mentee App
    participant API as API Gateway
    participant BOOK as Booking Service
    participant AV as Availability Engine
    participant PAY as Payment Service
    participant DB as PostgreSQL

    MA->>API: POST /bookings (scheduledStartTime, mentorId, packageId, Idempotency-Key)
    API->>BOOK: Create scheduled booking
    BOOK->>DB: Check idempotency key
    alt Duplicate key found
        BOOK-->>MA: Return prior booking
    else New request
        BOOK->>AV: Validate exact requested slot
        AV->>DB: Lock/validate slot
        BOOK->>DB: Insert booking (payment_pending)
        BOOK->>PAY: Capture payment (idempotent)
        PAY-->>BOOK: captured / failed / pending
        BOOK->>DB: Update state accordingly
        BOOK-->>MA: booking response
    end
```

### Failure Scenarios

- Duplicate create calls due to network retries -> dedupe by idempotency key.
- Slot race between two mentees -> one confirms; other gets `409 SLOT_CONFLICT`.
- Payment success but booking write fails -> reconciliation worker repairs state.
- Gateway timeout with unknown result -> booking remains `payment_pending` pending reconciliation.
- Mentor goes unavailable between search and booking -> final validation fails with `409`.

### Retry Logic

- Booking creation requires `Idempotency-Key`; same key must return same result.
- Payment capture retried with gateway idempotency reference.
- Reconciliation cron resolves uncertain payment states and updates booking.
- Client retry behavior:
  - same key -> safe retry
  - new key -> treated as new booking attempt

---

## 4) OTP Session Validation (Session Start)

### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant Mentor as Mentor App
    participant Mentee as Mentee App
    participant API as API Gateway
    participant SESS as Session Service
    participant DB as PostgreSQL
    participant TIMER as Timer Service

    Mentor->>API: POST /bookings/{id}/session-start-otp (otpCode, actorRole=mentor)
    API->>SESS: Validate mentor OTP submission
    SESS->>DB: Load booking + otp_session FOR UPDATE
    SESS->>DB: Mark mentor validated
    SESS-->>Mentor: OTP accepted, waiting for mentee

    Mentee->>API: POST /bookings/{id}/session-start-otp (otpCode, actorRole=mentee)
    API->>SESS: Validate mentee OTP submission
    SESS->>DB: Load same booking + otp_session FOR UPDATE
    SESS->>DB: Mark mentee validated
    SESS->>TIMER: Start server timer(duration)
    SESS->>DB: booking -> started, actual_started_at=now()
    SESS-->>Mentee: Session started
    SESS-->>Mentor: Session started (push/websocket)
```

### Failure Scenarios

- Booking not in `confirmed` state -> `409 INVALID_BOOKING_STATE`.
- OTP outside validity window -> `400 OTP_EXPIRED`.
- One side validates, second side never validates within grace -> auto no-show transition.
- Duplicate submission by same actor -> return idempotent success (already validated).
- Too many invalid attempts -> lock OTP and reject.

### Retry Logic

- Validation endpoint idempotent per `(booking_id, actor_role)`.
- Optional one-time OTP re-issue within grace window; old OTP invalidated.
- Timeout worker transitions stale bookings to `mentor_no_show` / `mentee_no_show`.

---

## 5) Session Billing

### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant SESS as Session Service
    participant TIMER as Timer Service
    participant Q as Queue
    participant BILL as Billing Service
    participant DB as PostgreSQL

    SESS->>TIMER: Start timer when dual OTP succeeds
    TIMER->>Q: Heartbeats + completion event
    Q->>BILL: Consume completion event (idempotency key)
    BILL->>DB: Load booking/payment FOR UPDATE
    BILL->>BILL: Apply billing policy (MVP: full package charge once started)
    BILL->>DB: booking -> completed, actual_ended_at
    BILL->>DB: Persist billing ledger entries
    BILL-->>Q: Emit payout-eligible event
```

### Failure Scenarios

- Duplicate completion events from retries/reconnects -> dedupe by idempotency key.
- Session disconnects mid-call -> timer remains server-authoritative.
- Early end by mentee -> no billing change in MVP (full package).
- Early end by mentor -> flag for refund workflow.
- Billing consumer crash after DB write before ack -> safe reprocess due to idempotency.

### Retry Logic

- Queue consumer: at-least-once processing + idempotent DB mutations.
- Transient DB/gateway errors: exponential backoff retry.
- Poison messages: dead-letter queue + operator alert.

---

## 6) Payment and Payout

### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant BOOK as Booking Service
    participant PAY as Payment Service
    participant GW as Payment Gateway
    participant LED as Ledger Service
    participant DB as PostgreSQL
    participant PAYOUT as Payout Service
    participant WAL as Wallet Service

    BOOK->>PAY: Capture payment(bookingId, amount, idempotency)
    PAY->>GW: Capture request
    GW-->>PAY: success / failure / unknown
    PAY->>DB: Upsert payment(status, provider refs)
    PAY->>LED: Record gross, platform fee, mentor net

    Note over PAYOUT,DB: Triggered after booking completion + hold period
    PAYOUT->>DB: Fetch payout-eligible payments
    PAYOUT->>WAL: Credit mentor pending/available balance
    PAYOUT->>GW: Initiate transfer to mentor account (if direct rail)
    GW-->>PAYOUT: transfer success/failure
    PAYOUT->>DB: Update payout/settlement status
```

### Failure Scenarios

- Capture request timeout with unknown status -> reconciliation required via provider reference.
- Duplicate capture/refund attempt -> blocked via idempotency + unique provider refs.
- Refund after payout completed -> create negative adjustment in next payout cycle.
- Transfer failure -> keep funds pending and retry; notify mentor if prolonged.
- Ledger mismatch (rare) -> freeze payout for affected booking, raise ops alert.

### Retry Logic

- Payment capture: bounded retries with same idempotency key.
- Reconciliation worker polls uncertain transactions until terminal status.
- Payout transfer retries with exponential backoff and max-attempt threshold.
- Wallet balance updates use optimistic locking/version checks to avoid race conditions.

---

## Cross-Cutting Reliability and Consistency Rules

- Use UTC (`timestamptz`) as canonical time source across all services.
- Every mutating API should be idempotent (`Idempotency-Key` or natural key).
- Use transactional locks (`SELECT ... FOR UPDATE`) for critical state transitions:
  - OTP verify/consume
  - booking state updates
  - payment finalization
- Keep append-only financial/event logs for reconciliation and audits.
- Run background jobs for:
  - payment-booking reconciliation
  - OTP/session timeout transitions
  - payout retry and settlement reconciliation

