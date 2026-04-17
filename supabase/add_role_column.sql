-- Add role column to team_members
-- Run this in Supabase SQL Editor

ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Member' CHECK (role IN ('Admin', 'Member'));

-- Optionally add last_active column for tracking
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE;
