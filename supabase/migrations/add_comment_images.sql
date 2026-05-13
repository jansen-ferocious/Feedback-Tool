-- Add image_url column to feedback_notes for comment images
ALTER TABLE feedback_notes ADD COLUMN IF NOT EXISTS image_url TEXT;
