-- Notification email digest support.
--
-- Adds an `email_sent_at` column so the digest job knows which notifications
-- it has already emailed, and an AFTER INSERT trigger on `feedback` so that
-- widget-submitted feedback (which bypasses the JS createNotification helper)
-- still produces an in-app notification for the auto-assigned team member.
--
-- The actual email send happens in the `send-notification-digest` edge
-- function, invoked by pg_cron every 30 minutes (see schedule block at bottom).

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_notifications_email_pending
  ON notifications (created_at)
  WHERE email_sent_at IS NULL;

-- Trigger: when new feedback lands with an assignee, create a notification
-- for that assignee. The trigger only fires on INSERT, so reassignments made
-- inside the app (which already call createNotification from FeedbackModal)
-- aren't duplicated.
CREATE OR REPLACE FUNCTION notify_feedback_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_name TEXT;
  v_preview TEXT;
BEGIN
  IF NEW.assigned_to IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_project_name FROM projects WHERE id = NEW.project_id;

  v_preview := COALESCE(NEW.comment, '');
  IF length(v_preview) > 80 THEN
    v_preview := substring(v_preview FROM 1 FOR 80) || '...';
  END IF;

  INSERT INTO notifications (user_id, type, title, message, project_id, feedback_id, actor_id)
  VALUES (
    NEW.assigned_to,
    'assignment',
    'New feedback assigned to you',
    v_preview,
    NEW.project_id,
    NEW.id,
    NULL  -- widget submissions have no team-member actor
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS feedback_assignment_notify ON feedback;
CREATE TRIGGER feedback_assignment_notify
  AFTER INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION notify_feedback_assignment();


-- ---------------------------------------------------------------------------
-- pg_cron schedule (run once, after deploying the send-notification-digest
-- edge function). Requires pg_cron + pg_net extensions enabled in the
-- Supabase dashboard (Database > Extensions).
--
-- Replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY before running.
-- ---------------------------------------------------------------------------
--
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- SELECT cron.schedule(
--   'send-notification-digest',
--   '*/30 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification-digest',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
--
-- To remove later: SELECT cron.unschedule('send-notification-digest');
