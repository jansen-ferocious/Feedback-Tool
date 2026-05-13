-- Allow team members to update project settings
-- Previously only the project owner could modify projects

-- Drop the restrictive owner-only policy
DROP POLICY IF EXISTS "projects_owner_all" ON projects;

-- Owner can insert new projects
CREATE POLICY "projects_owner_insert" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Owner can delete projects
CREATE POLICY "projects_owner_delete" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Any authenticated user can update projects (for team collaboration)
CREATE POLICY "projects_authenticated_update" ON projects
  FOR UPDATE USING (auth.role() = 'authenticated');
