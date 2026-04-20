import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

export default function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentMemberId, setCurrentMemberId] = useState(null)

  // Get current user's team member ID
  useEffect(() => {
    async function getMemberId() {
      if (!user?.email) return

      const { data } = await supabase
        .from('team_members')
        .select('id')
        .eq('email', user.email)
        .single()

      if (data) {
        setCurrentMemberId(data.id)
      }
    }
    getMemberId()
  }, [user?.email])

  // Fetch notifications
  useEffect(() => {
    if (!currentMemberId) return

    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications-page')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentMemberId}`,
      }, () => fetchNotifications())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [currentMemberId])

  async function fetchNotifications() {
    if (!currentMemberId) return

    const { data } = await supabase
      .from('notifications')
      .select(`
        *,
        project:projects(id, name),
        actor:team_members!notifications_actor_id_fkey(id, name, avatar_url)
      `)
      .eq('user_id', currentMemberId)
      .order('created_at', { ascending: false })

    setNotifications(data || [])
    setLoading(false)
  }

  async function markAsRead(notificationId) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
  }

  async function markAllAsRead() {
    if (!currentMemberId) return

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', currentMemberId)
      .eq('read', false)

    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function handleNotificationClick(notification) {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Navigate based on notification type
    if (notification.project_id) {
      if (notification.type === 'comment' && notification.feedback_id) {
        navigate(`/project/${notification.project_id}?feedback=${notification.feedback_id}`)
      } else {
        navigate(`/project/${notification.project_id}`)
      }
    }
  }

  function formatTime(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <BellIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-gray-500 dark:text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn-outline text-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <BellIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications yet</h3>
            <p className="text-gray-500 dark:text-gray-400">
              You'll be notified when feedback is assigned to you or someone comments on your feedback.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left ${
                  !notification.read ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
                }`}
              >
                {/* Avatar */}
                {notification.actor?.avatar_url ? (
                  <img
                    src={notification.actor.avatar_url}
                    alt={notification.actor.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    {notification.actor?.name?.[0]?.toUpperCase() || (
                      notification.type === 'comment' ? <CommentIcon className="w-5 h-5" /> : <AssignmentIcon className="w-5 h-5" />
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {notification.project?.name && (
                          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                            {notification.project.name}
                          </span>
                        )}
                        {notification.project?.name && (
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                        )}
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0 mt-1.5"></div>
                    )}
                  </div>
                </div>

                {/* Type icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  notification.type === 'comment'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                }`}>
                  {notification.type === 'comment' ? (
                    <CommentIcon className="w-4 h-4" />
                  ) : (
                    <AssignmentIcon className="w-4 h-4" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}

function CommentIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function AssignmentIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}
