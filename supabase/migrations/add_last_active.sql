-- Add last_active column to team_members if it doesn't exist
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE;

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_team_members_last_active ON team_members(last_active DESC);
