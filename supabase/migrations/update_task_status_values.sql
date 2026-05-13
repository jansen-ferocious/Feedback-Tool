-- Update project_tasks status values to match internal feedback statuses
-- First, drop the existing CHECK constraint
ALTER TABLE project_tasks DROP CONSTRAINT IF EXISTS project_tasks_status_check;

-- Update existing status values to new values
UPDATE project_tasks SET status = 'not_started' WHERE status = 'pre_launch';
UPDATE project_tasks SET status = 'done' WHERE status = 'post_launch';
-- 'needs_review' stays the same
-- 'ignored' stays the same

-- Add new CHECK constraint with updated values
ALTER TABLE project_tasks ADD CONSTRAINT project_tasks_status_check
  CHECK (status IN ('not_started', 'in_progress', 'done', 'needs_review', 'ignored'));
