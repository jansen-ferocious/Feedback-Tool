-- Add links, images, description, and assigned_to columns to project_tasks
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS links TEXT[]; -- Array of URLs
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS images TEXT[]; -- Array of image URLs
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS description TEXT; -- Rich text description (HTML)
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL;
