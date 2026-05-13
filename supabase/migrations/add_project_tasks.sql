-- Create project_tasks table for client-provided checklists
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pre_launch' CHECK (status IN ('pre_launch', 'post_launch', 'ignored', 'needs_review')),
  completed BOOLEAN DEFAULT FALSE,
  completed_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  position INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX idx_project_tasks_status ON project_tasks(status);
CREATE INDEX idx_project_tasks_completed ON project_tasks(completed);

-- Enable RLS
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all tasks
CREATE POLICY "Authenticated users can read tasks" ON project_tasks
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert tasks
CREATE POLICY "Authenticated users can insert tasks" ON project_tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update tasks
CREATE POLICY "Authenticated users can update tasks" ON project_tasks
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete tasks
CREATE POLICY "Authenticated users can delete tasks" ON project_tasks
  FOR DELETE USING (auth.role() = 'authenticated');
