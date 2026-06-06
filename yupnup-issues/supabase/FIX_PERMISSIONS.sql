-- ============================================================
-- RUN THIS IN SUPABASE → SQL EDITOR → NEW QUERY
-- This fixes permissions so ALL logged-in users can:
-- - Create tickets
-- - Edit tickets  
-- - Change status
-- - Add comments
-- Only ADMINS can delete tickets
-- ============================================================

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Team members and admins can create tickets" ON tickets;
DROP POLICY IF EXISTS "Team members and admins can update tickets" ON tickets;
DROP POLICY IF EXISTS "Team members can create comments" ON comments;
DROP POLICY IF EXISTS "Team members can upload screenshots" ON screenshots;
DROP POLICY IF EXISTS "Team members can insert activity logs" ON activity_logs;

-- New open policies — any logged-in user can do everything except delete

CREATE POLICY "Any logged in user can create tickets"
  ON tickets FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Any logged in user can update tickets"
  ON tickets FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Any logged in user can add comments"
  ON comments FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Any logged in user can upload screenshots"
  ON screenshots FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Any logged in user can log activity"
  ON activity_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Profiles: any logged in user can update any profile (for role changes)
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Any logged in user can update profiles"
  ON profiles FOR UPDATE TO authenticated
  USING (true);

SELECT 'Permissions fixed! All users can now create, edit, comment and change status.' as result;
