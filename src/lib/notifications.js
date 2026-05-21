import { supabase } from './supabase'

/**
 * Creates an in-app notification. Email delivery is handled separately by the
 * `send-notification-digest` edge function, which runs on a 30-minute pg_cron
 * schedule and batches all unsent notifications per recipient into one email.
 *
 * @param {Object} notification - notification row to insert
 * @param {string} notification.user_id - team_members.id of the recipient
 * @param {string} notification.type - 'assignment' | 'comment' | etc.
 * @param {string} notification.title
 * @param {string} [notification.message]
 * @param {string} [notification.project_id]
 * @param {string} [notification.feedback_id]
 * @param {string} [notification.task_id]
 * @param {string} [notification.actor_id]
 */
export async function createNotification(notification) {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single()

  if (error) {
    console.error('Failed to create notification:', error)
    return { data: null, error }
  }

  return { data, error: null }
}
