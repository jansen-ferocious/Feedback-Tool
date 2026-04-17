-- Add icon_url column to projects
-- Run this in Supabase SQL Editor

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS icon_url TEXT;
