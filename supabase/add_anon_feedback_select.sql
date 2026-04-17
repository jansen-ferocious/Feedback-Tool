-- Allow anonymous users to read feedback (for widget markers)
-- Run this in Supabase SQL Editor

CREATE POLICY "feedback_anon_select" ON feedback
  FOR SELECT USING (true);
