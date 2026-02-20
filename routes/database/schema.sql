-- =====================================================
-- Rugby Anthem Zone — Paddle-First Database Schema
-- Phase: Backend Foundation
-- Database: PostgreSQL
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  auth_provider VARCHAR(50) DEFAULT 'email',
  paddle_customer_id VARCHAR(255),
  tier VARCHAR(50) DEFAULT 'free',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_paddle_customer ON users(paddle_customer_id);

-- TIERS
CREATE TABLE IF NOT EXISTS tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_code VARCHAR(50) UNIQUE NOT NULL,
  tier_rank INTEGER NOT NULL,
  paddle_price_id VARCHAR(255) UNIQUE,
  display_name VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tiers_price_id ON tiers(paddle_price_id);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  paddle_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  paddle_customer_id VARCHAR(255),
  tier_code VARCHAR(50) REFERENCES tiers(tier_code),
  status VARCHAR(50) NOT NULL,
  currency VARCHAR(3),
  next_billing_date TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_sub ON subscriptions(paddle_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(paddle_customer_id);

-- PAYMENT EVENTS
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

CREATE INDEX IF NOT EXISTS idx_payment_events_subscription ON payment_events(paddle_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_customer ON payment_events(paddle_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_event ON payment_events(paddle_event_id);

-- WEBHOOK IDEMPOTENCY
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paddle_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_event_id ON webhook_events(paddle_event_id);

-- USER ACCESS CACHE
CREATE TABLE IF NOT EXISTS user_access_cache (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tier_code VARCHAR(50),
  has_premium BOOLEAN DEFAULT FALSE,
  has_super BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SEED TIERS
INSERT INTO tiers (tier_code, tier_rank, display_name)
VALUES
  ('free', 0, 'Free'),
  ('premium', 1, 'Premium'),
  ('super', 2, 'Super')
ON CONFLICT (tier_code) DO NOTHING;