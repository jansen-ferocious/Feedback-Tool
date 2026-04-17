-- NUCLEAR OPTION: Drop ALL policies and recreate from scratch
-- Run this in your Supabase SQL Editor

-- First, let's see and drop ALL policies on these tables
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on projects
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'projects' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON projects', pol.policyname);
    END LOOP;

    -- Drop all policies on team_members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'team_members' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON team_members', pol.policyname);
    END LOOP;

    -- Drop all policies on feedback
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'feedback' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON feedback', pol.policyname);
    END LOOP;
END $$;

-- Drop trigger and function
DROP TRIGGER IF EXISTS on_project_created ON projects;
DROP FUNCTION IF EXISTS add_owner_as_team_member();

-- ============================================
-- PROJECTS - Simple owner-only policies
-- ============================================

CREATE POLICY "projects_select" ON projects
  FOR SELECT USING (auth.uid() = user_id);

-- Allow widget to look up project by API key (for anonymous feedback submission)
CREATE POLICY "projects_select_by_api_key" ON projects
  FOR SELECT USING (true);

CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "projects_delete" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TEAM_MEMBERS - Allow all for authenticated users
-- (We'll rely on app-level checks)
-- ============================================

CREATE POLICY "team_members_all" ON team_members
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================
-- FEEDBACK - Project owner + anonymous insert
-- ============================================

CREATE POLICY "feedback_owner" ON feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = feedback.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "feedback_anon_insert" ON feedback
  FOR INSERT WITH CHECK (true);

-- ============================================
-- STORAGE - screenshots bucket
-- ============================================

-- Drop storage policies too
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'screenshots');

CREATE POLICY "storage_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'screenshots');
