-- Create task_comments table for client requested task comments
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);

-- RLS policies
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read task comments
CREATE POLICY "Anyone can read task comments"
  ON task_comments FOR SELECT
  USING (true);

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can insert task comments"
  ON task_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own task comments"
  ON task_comments FOR DELETE
  TO authenticated
  USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Add task_id column to notifications table for task comment notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE;

-- Index for task notifications
CREATE INDEX IF NOT EXISTS idx_notifications_task_id ON notifications(task_id);
