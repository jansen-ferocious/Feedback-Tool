-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'assignment' or 'comment'
  title TEXT NOT NULL,
  message TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES team_members(id) ON DELETE SET NULL, -- who triggered the notification
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT
  USING (true);

-- Allow inserting notifications (for triggers/app logic)
CREATE POLICY "Allow inserting notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE
  USING (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE
  USING (true);
