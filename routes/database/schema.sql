-- =====================================================
-- Rugby Anthem Zone — One-Tier Paid Access Schema
-- Database: PostgreSQL
--
-- Transitional model:
-- - users.tier is retained temporarily for frontend compatibility
--   while the frontend still normalizes tier -> active/inactive
-- - "free"    = account exists but no active paid access
-- - "premium" = active paid Rugby Anthem Zone access
--
-- Source of truth split:
-- - users: fast auth/access cache for app runtime
-- - subscriptions: billing/subscription source of truth
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  auth_provider VARCHAR(50) DEFAULT 'email',

  -- Paddle identity
  paddle_customer_id VARCHAR(255),

  -- Transitional compatibility field for current frontend:
  -- free    => no active paid access
  -- premium => active paid RAZ access
  tier VARCHAR(50) DEFAULT 'free',

  -- Current fast access flag used by auth/subscription status
  is_active BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email
  ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_paddle_customer
  ON users(paddle_customer_id);

-- =====================================================
-- SUBSCRIPTIONS
-- Billing/subscription source of truth
-- One paid product only, so no premium/super split
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  paddle_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  paddle_customer_id VARCHAR(255),

  -- one-tier app still stores status lifecycle here
  -- examples: active, canceling, cancelled, paused, past_due
  status VARCHAR(50) NOT NULL,

  currency VARCHAR(3),
  next_billing_date TIMESTAMP,
  cancelled_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user
  ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_sub
  ON subscriptions(paddle_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer
  ON subscriptions(paddle_customer_id);

-- =====================================================
-- PAYMENT EVENTS
-- Raw event log / transaction audit
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  paddle_event_id VARCHAR(255),
  paddle_subscription_id VARCHAR(255),
  paddle_customer_id VARCHAR(255),

  event_type VARCHAR(100),
  amount NUMERIC(10,2),
  currency VARCHAR(3),

  raw_payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_subscription
  ON payment_events(paddle_subscription_id);

CREATE INDEX IF NOT EXISTS idx_payment_events_customer
  ON payment_events(paddle_customer_id);

CREATE INDEX IF NOT EXISTS idx_payment_events_event
  ON payment_events(paddle_event_id);

-- =====================================================
-- WEBHOOK IDEMPOTENCY
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paddle_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_event_id
  ON webhook_events(paddle_event_id);

-- =====================================================
-- USER LOYALTY
-- Leave as-is for now; unrelated to paid access reset
-- =====================================================
CREATE TABLE IF NOT EXISTS user_loyalty (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE,
  points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);