-- Migration 009: New signup flow
-- 1. Add user_id to signup_requests
-- 2. Add email_verified to profiles

ALTER TABLE signup_requests ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
