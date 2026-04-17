-- Add widget_active column to projects table
-- Run this in Supabase SQL Editor

ALTER TABLE projects ADD COLUMN IF NOT EXISTS widget_active BOOLEAN DEFAULT true;
