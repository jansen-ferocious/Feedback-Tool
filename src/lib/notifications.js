import { supabase } from './supabase'

/**
 * Creates an in-app notification and triggers an email to the recipient.
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

  // Fire-and-forget the email. We don't block the UI if the email fails —
  // the in-app notification still exists.
  supabase.functions
    .invoke('send-notification-email', { body: { notification_id: data.id } })
    .catch((err) => console.error('Failed to send notification email:', err))

  return { data, error: null }
}
