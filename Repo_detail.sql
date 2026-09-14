-- PostgreSQL 14+ recommended
-- Core extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS btree_gist; -- exclusion constraints

-- Optional enums (or use text + CHECK if you prefer easier migrations)
CREATE TYPE user_role AS ENUM ('mentee', 'mentor', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE booking_type AS ENUM ('instant', 'scheduled');
CREATE TYPE session_mode AS ENUM ('video', 'voice', 'chat');
CREATE TYPE booking_status AS ENUM (
  'created', 'payment_pending', 'confirmed', 'started', 'completed',
  'cancelled', 'failed', 'mentor_no_show', 'mentee_no_show'
);
CREATE TYPE otp_purpose AS ENUM ('login', 'session_start');
CREATE TYPE otp_status AS ENUM ('active', 'verified', 'expired', 'locked', 'cancelled');
CREATE TYPE payment_status AS ENUM (
  'pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'
);

-- 1) users
CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_country_code    VARCHAR(6) NOT NULL CHECK (phone_country_code ~ '^\+[1-9][0-9]{0,3}$'),
  phone_number          VARCHAR(15) NOT NULL CHECK (phone_number ~ '^[0-9]{6,15}$'),
  role                  user_role NOT NULL,
  status                user_status NOT NULL DEFAULT 'active',
  first_name            VARCHAR(64),
  last_name             VARCHAR(64),
  timezone              TEXT NOT NULL DEFAULT 'UTC',
  languages             TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  city                  VARCHAR(64),
  state                 VARCHAR(64),
  country_code          CHAR(2) CHECK (country_code ~ '^[A-Z]{2}$'),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ,
  UNIQUE (phone_country_code, phone_number)
);

CREATE INDEX idx_users_role_status ON users (role, status);
CREATE INDEX idx_users_created_at ON users (created_at DESC);

-- 2) mentors (1:1 with users where role=mentor)
CREATE TABLE mentors (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL UNIQUE
                              REFERENCES users(id) ON DELETE CASCADE,
  bio                         TEXT NOT NULL CHECK (length(bio) BETWEEN 20 AND 2000),
  headline                    VARCHAR(160),
  discoverable                BOOLEAN NOT NULL DEFAULT false,
  is_available_now            BOOLEAN NOT NULL DEFAULT false,
  timezone                    TEXT NOT NULL,
  expertise_category_id       UUID NOT NULL,
  expertise_subcategory_id    UUID NOT NULL,
  expertise_language          VARCHAR(32) NOT NULL,
  modalities                  session_mode[] NOT NULL,
  default_session_price_paise INTEGER NOT NULL CHECK (default_session_price_paise >= 100),
  default_duration_minutes    INTEGER NOT NULL CHECK (default_duration_minutes BETWEEN 15 AND 240),
  rating_avg                  NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating_avg BETWEEN 0 AND 5),
  total_sessions              INTEGER NOT NULL DEFAULT 0 CHECK (total_sessions >= 0),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mentors_discovery
  ON mentors (discoverable, expertise_category_id, expertise_subcategory_id, expertise_language);

CREATE INDEX idx_mentors_available
  ON mentors (discoverable, is_available_now, updated_at DESC);

-- 3) mentee_profiles (1:1 with users where role=mentee)
CREATE TABLE mentee_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL UNIQUE
                            REFERENCES users(id) ON DELETE CASCADE,
  preferred_languages       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  interest_category_id      UUID NOT NULL,
  interest_subcategory_id   UUID NOT NULL,
  interest_language         VARCHAR(32) NOT NULL,
  onboarding_completed_at   TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mentee_profiles_interest
  ON mentee_profiles (interest_category_id, interest_subcategory_id, interest_language);

-- 4) mentor_availability
-- slot_range enables efficient overlap checks + no-overlap constraint per mentor
CREATE TABLE mentor_availability (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id          UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  slot_range         TSTZRANGE NOT NULL, -- [start, end)
  recurrence_rule    TEXT,               -- optional RRULE
  timezone           TEXT NOT NULL,
  is_blocked         BOOLEAN NOT NULL DEFAULT false,
  version            INTEGER NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (lower(slot_range) < upper(slot_range))
);

-- Prevent overlapping active availability windows for same mentor.
ALTER TABLE mentor_availability
ADD CONSTRAINT ex_mentor_availability_no_overlap
EXCLUDE USING gist (
  mentor_id WITH =,
  slot_range WITH &&
) WHERE (is_blocked = false);

CREATE INDEX idx_mentor_availability_mentor_range
  ON mentor_availability USING gist (mentor_id, slot_range);

CREATE INDEX idx_mentor_availability_updated
  ON mentor_availability (mentor_id, updated_at DESC);

-- 5) bookings
CREATE TABLE bookings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_user_id              UUID NOT NULL REFERENCES users(id),
  mentor_id                   UUID NOT NULL REFERENCES mentors(id),
  booking_type                booking_type NOT NULL,
  session_mode                session_mode NOT NULL,
  status                      booking_status NOT NULL DEFAULT 'created',
  scheduled_start_at          TIMESTAMPTZ NOT NULL,
  scheduled_end_at            TIMESTAMPTZ NOT NULL,
  actual_started_at           TIMESTAMPTZ,
  actual_ended_at             TIMESTAMPTZ,
  duration_minutes            INTEGER NOT NULL CHECK (duration_minutes BETWEEN 15 AND 240),
  gross_amount_paise          INTEGER NOT NULL CHECK (gross_amount_paise >= 0),
  platform_fee_paise          INTEGER NOT NULL CHECK (platform_fee_paise >= 0),
  mentor_net_paise            INTEGER NOT NULL CHECK (mentor_net_paise >= 0),
  currency                    CHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  create_idempotency_key      VARCHAR(128) NOT NULL,
  cancelled_by_user_id        UUID REFERENCES users(id),
  cancel_reason               VARCHAR(128),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (scheduled_start_at < scheduled_end_at),
  CHECK (gross_amount_paise = platform_fee_paise + mentor_net_paise),
  UNIQUE (mentee_user_id, create_idempotency_key)
);

-- Avoid double-booking same mentor in active states (partial unique)
CREATE UNIQUE INDEX uq_active_mentor_timeslot
ON bookings (mentor_id, scheduled_start_at, scheduled_end_at)
WHERE status IN ('created','payment_pending','confirmed','started');

CREATE INDEX idx_bookings_mentee_status_created
  ON bookings (mentee_user_id, status, created_at DESC);

CREATE INDEX idx_bookings_mentor_status_start
  ON bookings (mentor_id, status, scheduled_start_at);

CREATE INDEX idx_bookings_status_start
  ON bookings (status, scheduled_start_at);

-- 6) otp_sessions (login + session-start OTP)
CREATE TABLE otp_sessions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID REFERENCES users(id) ON DELETE SET NULL, -- nullable for unknown phone pre-signup
  booking_id             UUID REFERENCES bookings(id) ON DELETE CASCADE, -- only for session_start OTP
  purpose                otp_purpose NOT NULL,
  phone_country_code     VARCHAR(6),
  phone_number           VARCHAR(15),
  otp_hash               TEXT NOT NULL, -- never store plaintext OTP
  status                 otp_status NOT NULL DEFAULT 'active',
  max_attempts           SMALLINT NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
  attempts_used          SMALLINT NOT NULL DEFAULT 0 CHECK (attempts_used >= 0),
  resend_count           SMALLINT NOT NULL DEFAULT 0 CHECK (resend_count >= 0),
  resend_cooldown_until  TIMESTAMPTZ,
  expires_at             TIMESTAMPTZ NOT NULL,
  verified_at            TIMESTAMPTZ,
  ip_address             INET,
  user_agent             TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (purpose = 'login' AND booking_id IS NULL)
    OR (purpose = 'session_start' AND booking_id IS NOT NULL)
  )
);

CREATE INDEX idx_otp_lookup_active
  ON otp_sessions (purpose, status, expires_at DESC);

CREATE INDEX idx_otp_phone_created
  ON otp_sessions (phone_country_code, phone_number, created_at DESC);

CREATE INDEX idx_otp_booking
  ON otp_sessions (booking_id, purpose);

-- 7) payments
CREATE TABLE payments (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id                 UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  payer_user_id              UUID NOT NULL REFERENCES users(id),
  status                     payment_status NOT NULL DEFAULT 'pending',
  provider                   VARCHAR(32) NOT NULL, -- razorpay/stripe/etc
  provider_payment_ref       VARCHAR(128),
  provider_order_ref         VARCHAR(128),
  amount_paise               INTEGER NOT NULL CHECK (amount_paise >= 0),
  currency                   CHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  platform_fee_paise         INTEGER NOT NULL CHECK (platform_fee_paise >= 0),
  mentor_net_paise           INTEGER NOT NULL CHECK (mentor_net_paise >= 0),
  refunded_amount_paise      INTEGER NOT NULL DEFAULT 0 CHECK (refunded_amount_paise >= 0),
  capture_idempotency_key    VARCHAR(128),
  refund_idempotency_key     VARCHAR(128),
  captured_at                TIMESTAMPTZ,
  failed_at                  TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (amount_paise = platform_fee_paise + mentor_net_paise),
  CHECK (refunded_amount_paise <= amount_paise),
  UNIQUE (provider, provider_payment_ref),
  UNIQUE (provider, provider_order_ref)
);

CREATE INDEX idx_payments_payer_created
  ON payments (payer_user_id, created_at DESC);

CREATE INDEX idx_payments_status_created
  ON payments (status, created_at DESC);

-- 8) wallets
-- one wallet per user (mentor payouts, platform credits, etc)
CREATE TABLE wallets (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  currency               CHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  available_balance_paise BIGINT NOT NULL DEFAULT 0,
  pending_balance_paise   BIGINT NOT NULL DEFAULT 0,
  lifetime_credited_paise BIGINT NOT NULL DEFAULT 0,
  lifetime_debited_paise  BIGINT NOT NULL DEFAULT 0,
  version                BIGINT NOT NULL DEFAULT 0, -- optimistic locking
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (available_balance_paise >= 0),
  CHECK (pending_balance_paise >= 0)
);

CREATE INDEX idx_wallets_currency ON wallets (currency);

-- 9) admin_portal_accounts — username/password operators for the admin web portal (JWT roles admin / super_admin).
-- Hibernate may create this table automatically (ddl-auto=update); this DDL matches the JPA entity (enum as string).
CREATE TABLE admin_portal_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        VARCHAR(64) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  kind            VARCHAR(24) NOT NULL CHECK (kind IN ('SUPER_ADMIN', 'ADMIN')),
  active          BOOLEAN NOT NULL DEFAULT true,
  created_by_id   UUID REFERENCES admin_portal_accounts(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_portal_accounts_kind ON admin_portal_accounts (kind);

-- Optional: insert a super admin without using env bootstrap. Generate password_hash with BCrypt, e.g. in Java:
--   new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("your-secret-password")
-- INSERT INTO admin_portal_accounts (username, password_hash, kind)
-- VALUES ('superadmin', '$2a$10$...bcrypt...', 'SUPER_ADMIN');