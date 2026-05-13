-- Add archived column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived);
