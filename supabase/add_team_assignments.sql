-- Add team column to team_members
-- Run this in Supabase SQL Editor

-- Add team field to team_members
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS team TEXT CHECK (team IN ('Dev', 'Content', 'SEO', 'Project Manager', 'Design'));

-- Add default assignees to projects for auto-assignment
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS dev_assignee_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS content_assignee_id UUID REFERENCES team_members(id) ON DELETE SET NULL;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team);
CREATE INDEX IF NOT EXISTS idx_projects_dev_assignee ON projects(dev_assignee_id);
CREATE INDEX IF NOT EXISTS idx_projects_content_assignee ON projects(content_assignee_id);
