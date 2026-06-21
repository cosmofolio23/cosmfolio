-- Add missing columns to users table that were never migrated
-- Run this once in Supabase SQL Editor
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS export_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS college_name TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS year_of_passing TEXT,
  ADD COLUMN IF NOT EXISTS stream TEXT;
