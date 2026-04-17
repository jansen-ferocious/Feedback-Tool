-- Feedback Widget Database Schema
-- Version 2: App-level team members (no per-project teams)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table (each website gets a project)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT,
  api_key UUID UNIQUE DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members (app-level, can be assigned to any feedback)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback submissions
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'done', 'ignored')) DEFAULT 'not_started',
  assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
  element_selector TEXT,
  element_html TEXT,
  page_url TEXT NOT NULL,
  screenshot_url TEXT,
  comment TEXT,
  submitter_name TEXT,
  submitter_email TEXT,
  browser TEXT,
  os TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_api_key ON projects(api_key);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_feedback_project_id ON feedback(project_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_assigned_to ON feedback(assigned_to);

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROJECTS POLICIES
-- ============================================

-- Project owners can do everything with their projects
CREATE POLICY "projects_owner_all" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Anonymous can read projects (for widget API key lookup)
CREATE POLICY "projects_anon_select" ON projects
  FOR SELECT USING (true);

-- ============================================
-- TEAM MEMBERS POLICIES
-- ============================================

-- Any authenticated user can view team members
CREATE POLICY "team_members_select" ON team_members
  FOR SELECT USING (auth.role() = 'authenticated');

-- Any authenticated user can manage team members
CREATE POLICY "team_members_insert" ON team_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "team_members_update" ON team_members
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "team_members_delete" ON team_members
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- FEEDBACK POLICIES
-- ============================================

-- Project owners can manage all feedback
CREATE POLICY "feedback_owner_all" ON feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = feedback.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Authenticated users can view and update all feedback
CREATE POLICY "feedback_auth_select" ON feedback
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "feedback_auth_update" ON feedback
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow anonymous feedback submissions (widget)
CREATE POLICY "feedback_insert_anon" ON feedback
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = feedback.project_id
    )
  );

-- ============================================
-- STORAGE
-- ============================================

-- Create storage bucket for screenshots (run this separately if bucket exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for screenshots
CREATE POLICY "screenshots_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'screenshots');

CREATE POLICY "screenshots_view" ON storage.objects
  FOR SELECT USING (bucket_id = 'screenshots');
