-- Migration: Remove project_id from team_members (app-level users)
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop existing policies and triggers
-- ============================================

-- Drop trigger and function
DROP TRIGGER IF EXISTS on_project_created ON projects;
DROP FUNCTION IF EXISTS add_owner_as_team_member();

-- Drop team_members policies
DROP POLICY IF EXISTS "team_members_owner_all" ON team_members;
DROP POLICY IF EXISTS "team_members_view_own_project" ON team_members;

-- Drop feedback policies that reference team_members.project_id
DROP POLICY IF EXISTS "feedback_team_select" ON feedback;
DROP POLICY IF EXISTS "feedback_team_update" ON feedback;

-- ============================================
-- STEP 2: Modify team_members table
-- ============================================

-- Remove unique constraint on (project_id, email)
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_project_id_email_key;

-- Add unique constraint on just email
ALTER TABLE team_members ADD CONSTRAINT team_members_email_key UNIQUE (email);

-- Make project_id nullable (we'll remove it later, but this is safer)
ALTER TABLE team_members ALTER COLUMN project_id DROP NOT NULL;

-- Drop the project_id index
DROP INDEX IF EXISTS idx_team_members_project_id;

-- Remove the role column (no longer needed for app-level users)
ALTER TABLE team_members DROP COLUMN IF EXISTS role;

-- Remove project_id foreign key and column
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_project_id_fkey;
ALTER TABLE team_members DROP COLUMN IF EXISTS project_id;

-- ============================================
-- STEP 3: Create new policies for team_members
-- ============================================

-- Any authenticated user can view team members
CREATE POLICY "team_members_select" ON team_members
  FOR SELECT USING (auth.role() = 'authenticated');

-- Any authenticated user can insert team members
CREATE POLICY "team_members_insert" ON team_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Any authenticated user can update team members
CREATE POLICY "team_members_update" ON team_members
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Any authenticated user can delete team members
CREATE POLICY "team_members_delete" ON team_members
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- STEP 4: Update feedback policies
-- ============================================

-- Authenticated users can view feedback for any project they own
-- (keep existing feedback_owner_all policy)

-- Add policy for all authenticated users to view/update feedback
CREATE POLICY "feedback_auth_select" ON feedback
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "feedback_auth_update" ON feedback
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- DONE
-- ============================================
-- Team members are now app-level and can be assigned to feedback across all projects
