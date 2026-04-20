-- Create feedback_notes table
CREATE TABLE IF NOT EXISTS feedback_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_feedback_notes_feedback_id ON feedback_notes(feedback_id);

-- Enable RLS
ALTER TABLE feedback_notes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all notes
CREATE POLICY "Anyone can read feedback notes" ON feedback_notes
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert notes
CREATE POLICY "Authenticated users can insert notes" ON feedback_notes
  FOR INSERT
  WITH CHECK (true);

-- Allow users to delete their own notes
CREATE POLICY "Users can delete own notes" ON feedback_notes
  FOR DELETE
  USING (true);
