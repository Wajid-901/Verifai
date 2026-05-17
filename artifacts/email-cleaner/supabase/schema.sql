-- ============================================================
-- Email Cleaner — Supabase Schema
-- Run this in your Supabase project's SQL Editor
-- Idempotent: safe to re-run on existing databases
-- ============================================================

-- ── 1. Profiles (extends auth.users) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 text,
  full_name             text,
  avatar_url            text,
  plan                  text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  razorpay_customer_id  text,
  stripe_customer_id    text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Migrate existing profiles (add new columns if they don't exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS razorpay_customer_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id    text;

-- ── 2. Uploads ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.uploads (
  id            bigserial PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name     text NOT NULL,
  total_emails  integer NOT NULL CHECK (total_emails >= 0),
  valid_count   integer NOT NULL CHECK (valid_count >= 0),
  risky_count   integer NOT NULL DEFAULT 0 CHECK (risky_count >= 0),
  invalid_count integer NOT NULL CHECK (invalid_count >= 0),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── 3. Subscriptions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                        bigserial PRIMARY KEY,
  user_id                   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Razorpay
  razorpay_customer_id      text,
  razorpay_subscription_id  text,
  -- Stripe (legacy / future)
  stripe_customer_id        text,
  stripe_subscription_id    text,
  -- Common
  status                    text NOT NULL DEFAULT 'inactive',
  plan                      text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  current_period_end        timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Migrate existing subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS razorpay_customer_id     text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS razorpay_subscription_id text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id       text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id   text;

-- Add unique constraint on user_id if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_user_id_key'
      AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ── 4. Usage Tracking ─────────────────────────────────────────
-- Aggregated per-month credits; updated after each validation job.
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month             varchar(7) NOT NULL,  -- 'YYYY-MM'
  emails_validated  integer NOT NULL DEFAULT 0,
  jobs_completed    integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month)
);

-- ── 5. Billing Events ─────────────────────────────────────────
-- Immutable log of all payment / subscription events
CREATE TABLE IF NOT EXISTS public.billing_events (
  id                        bigserial PRIMARY KEY,
  user_id                   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type                text NOT NULL,
  razorpay_payment_id       text,
  razorpay_subscription_id  text,
  amount                    integer,   -- in smallest currency unit (paise)
  currency                  text NOT NULL DEFAULT 'INR',
  status                    text NOT NULL,
  created_at                timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_uploads_user_id          ON public.uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at       ON public.uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user       ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_rzp        ON public.subscriptions(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user      ON public.usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_user      ON public.billing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_created   ON public.billing_events(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY IF NOT EXISTS "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Uploads
CREATE POLICY IF NOT EXISTS "Users can view own uploads"
  ON public.uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own uploads"
  ON public.uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own uploads"
  ON public.uploads FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY IF NOT EXISTS "Users can view own subscription"
  ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Usage tracking
CREATE POLICY IF NOT EXISTS "Users can view own usage"
  ON public.usage_tracking FOR SELECT USING (auth.uid() = user_id);

-- Billing events
CREATE POLICY IF NOT EXISTS "Users can view own billing events"
  ON public.billing_events FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Atomically increment usage tracking (race-condition safe)
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id  uuid,
  p_month    varchar,
  p_emails   integer
) RETURNS void AS $$
BEGIN
  INSERT INTO public.usage_tracking (user_id, month, emails_validated, jobs_completed)
  VALUES (p_user_id, p_month, p_emails, 1)
  ON CONFLICT (user_id, month) DO UPDATE SET
    emails_validated = public.usage_tracking.emails_validated + EXCLUDED.emails_validated,
    jobs_completed   = public.usage_tracking.jobs_completed   + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
