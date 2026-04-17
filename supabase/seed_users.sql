-- Seed users from users.csv
-- Run this in Supabase SQL Editor

-- First, drop the existing team check constraint and add a new one with more options
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_team_check;
ALTER TABLE team_members ADD CONSTRAINT team_members_team_check
  CHECK (team IN ('Dev', 'Content', 'SEO', 'Project Manager', 'Account Management', 'Design'));

-- Now insert the users
INSERT INTO team_members (name, team, email, role) VALUES
('Alyssa DeSimone-Boller', 'Account Management', 'alyssa.desimone.boller@ferociousmedia.com', 'Member'),
('Brittany Garrity', 'Account Management', 'brittany@ferociousmedia.com', 'Member'),
('Carlos Robledo', 'Account Management', 'carlos@ferociousmedia.com', 'Member'),
('Charlotte Mountain', 'Dev', 'charlotte@ferociousmedia.com', 'Member'),
('Cole Vahamonde', 'Account Management', 'cole@ferociousmedia.com', 'Member'),
('Connor Dodd', 'SEO', 'connor@ferociousmedia.com', 'Member'),
('Emily Doyle', 'Account Management', 'emily.doyle@ferociousmedia.com', 'Member'),
('Jansen Collins', 'Dev', 'jansen@ferociousmedia.com', 'Admin'),
('Jay Mcleod II', 'SEO', 'jay@ferociousmedia.com', 'Member'),
('Jennifer Piet', 'Dev', 'jennifer@ferociousmedia.com', 'Member'),
('Joe Harps', 'Design', 'joe@ferociousmedia.com', 'Member'),
('Lia Bott', 'Content', 'lia@ferociousmedia.com', 'Member'),
('Mallory Arnold', 'Content', 'mallory@ferociousmedia.com', 'Member'),
('Melissa Erickson', 'Design', 'melissa@ferociousmedia.com', 'Member'),
('Michael Bateman', 'SEO', 'michaelb@ferociousmedia.com', 'Member'),
('Olivia Burke', 'Account Management', 'olivia@ferociousmedia.com', 'Member'),
('Rob Rodriguez', 'Account Management', 'robert@ferociousmedia.com', 'Member'),
('Robert Brown', 'Design', 'robert.brown@ferociousmedia.com', 'Member'),
('Sam Lucchese', 'Dev', 'sam@ferociousmedia.com', 'Member'),
('Shelby Green', 'SEO', 'shelby.green@ferociousmedia.com', 'Member'),
('Tiffany Godwin', 'SEO', 'tiffany@ferociousmedia.com', 'Member'),
('Yulia Dianova', 'SEO', 'yulia@ferociousmedia.com', 'Member')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  team = EXCLUDED.team;
