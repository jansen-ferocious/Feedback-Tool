import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'ignored', label: 'Ignored' },
]

function linkifyText(text) {
  if (!text) return ''
  const urlRegex = /(https?:\/\/[^\s<]+)/g
  const parts = text.split(urlRegex)
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary dark:text-[#de6bc0] hover:text-primary-light dark:hover:text-[#e98fd3] underline"
        >
          {part}
        </a>
      )
    }
    return part
  })
}

export default function FeedbackModal({ feedback, teamMembers, onClose, onUpdate, onDelete, columnFeedback = [], onNavigate }) {
  const { user } = useAuth()
  const [status, setStatus] = useState(feedback.status)
  const [assignedTo, setAssignedTo] = useState(feedback.assigned_to || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Comments state
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)
  const [currentMember, setCurrentMember] = useState(null)

  // Check if current user is the submitter
  const isSubmitter = user?.email && feedback.submitter_email &&
    user.email.toLowerCase() === feedback.submitter_email.toLowerCase()

  // Find current index and navigation targets
  const currentIndex = columnFeedback.findIndex(f => f.id === feedback.id)
  const prevFeedback = currentIndex > 0 ? columnFeedback[currentIndex - 1] : null
  const nextFeedback = currentIndex < columnFeedback.length - 1 ? columnFeedback[currentIndex + 1] : null

  // Reset form when feedback changes
  useEffect(() => {
    setStatus(feedback.status)
    setAssignedTo(feedback.assigned_to || '')
    setShowDeleteConfirm(false)
    setNewComment('')
    fetchComments()
  }, [feedback.id])

  // Get current user's team member record
  useEffect(() => {
    if (user?.email && teamMembers.length > 0) {
      const member = teamMembers.find(m => m.email?.toLowerCase() === user.email.toLowerCase())
      setCurrentMember(member || null)
    }
  }, [user?.email, teamMembers])

  async function fetchComments() {
    const { data } = await supabase
      .from('feedback_notes')
      .select('*, team_member:team_members(id, name, email, avatar_url)')
      .eq('feedback_id', feedback.id)
      .order('created_at', { ascending: true })

    setComments(data || [])
  }

  async function handleAddComment(e) {
    e.preventDefault()
    if (!newComment.trim() || !currentMember) return

    setAddingComment(true)
    const { error } = await supabase
      .from('feedback_notes')
      .insert({
        feedback_id: feedback.id,
        team_member_id: currentMember.id,
        content: newComment.trim()
      })

    if (error) {
      console.error('Error adding comment:', error)
      alert('Failed to add comment')
    } else {
      setNewComment('')
      fetchComments()
    }
    setAddingComment(false)
  }

  async function handleDeleteComment(commentId) {
    const { error } = await supabase
      .from('feedback_notes')
      .delete()
      .eq('id', commentId)

    if (!error) {
      fetchComments()
    }
  }

  async function saveChanges() {
    await supabase.from('feedback').update({ status, assigned_to: assignedTo || null }).eq('id', feedback.id)
    onUpdate()
  }

  async function handleSaveAndClose() {
    setSaving(true)
    await saveChanges()
    setSaving(false)
    onClose()
  }

  async function handleSaveAndNext() {
    if (!nextFeedback) return
    setSaving(true)
    await saveChanges()
    setSaving(false)
    onNavigate(nextFeedback)
  }

  function handlePrev() {
    if (prevFeedback) onNavigate(prevFeedback)
  }

  function handleNext() {
    if (nextFeedback) onNavigate(nextFeedback)
  }

  async function handleDelete() {
    if (!isSubmitter) return
    setDeleting(true)

    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', feedback.id)

    if (error) {
      console.error('Error deleting feedback:', error)
      alert('Failed to delete feedback: ' + error.message)
      setDeleting(false)
      return
    }

    // Optimistically remove from local state immediately
    if (onDelete) {
      onDelete(feedback.id)
    }

    setDeleting(false)
    onClose()
  }

  const formattedDate = new Date(feedback.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <>
    {/* Lightbox */}
    {lightboxOpen && (
      <div
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-8 cursor-pointer"
        onClick={() => setLightboxOpen(false)}
      >
        <button
          onClick={() => setLightboxOpen(false)}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img
          src={feedback.screenshot_url}
          alt=""
          className="max-w-[80vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    )}

    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative flex items-center gap-3">
        {/* Previous Arrow */}
        <button
          onClick={handlePrev}
          disabled={!prevFeedback}
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            prevFeedback
              ? 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 shadow-lg'
              : 'bg-white/50 dark:bg-slate-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Feedback Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left - Main Focus: Screenshot & Comment */}
            <div className="space-y-4">
              {feedback.screenshot_url && (
                <button onClick={() => setLightboxOpen(true)} className="block w-full text-left">
                  <img src={feedback.screenshot_url} alt="" className="w-full rounded-xl border border-border-light dark:border-border-dark hover:shadow-lg transition-shadow cursor-zoom-in" />
                </button>
              )}

              {feedback.comment && (
                <div className="rounded-xl p-4 bg-[#f4f5f6] dark:bg-slate-800 border border-[#ccc] dark:border-slate-600">
                  <p className="text-gray-900 dark:text-white leading-relaxed">
                    {linkifyText(feedback.comment)}
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="input mt-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right - Actions & Details */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Assign To</label>
                <div className="flex items-center gap-3 mt-2">
                  {assignedTo && teamMembers.find(m => m.id === assignedTo)?.avatar_url ? (
                    <img
                      src={teamMembers.find(m => m.id === assignedTo).avatar_url}
                      alt={teamMembers.find(m => m.id === assignedTo).name}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : assignedTo ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {teamMembers.find(m => m.id === assignedTo)?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  ) : null}
                  <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="input flex-1">
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Details</label>
                <div className="mt-2 rounded-xl p-4 space-y-2 text-sm bg-[#f4f5f6] dark:bg-slate-800 border border-[#ccc] dark:border-slate-600">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-gray-500 dark:text-gray-400 shrink-0">Submitted By</span>
                    {feedback.submitter_name || feedback.submitter_email ? (
                      <div className="flex items-center gap-2">
                        {feedback.submitter_avatar_url ? (
                          <img
                            src={feedback.submitter_avatar_url}
                            alt={feedback.submitter_name || 'Submitter'}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {feedback.submitter_name?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <span className="text-gray-900 dark:text-white truncate">
                          {feedback.submitter_name || feedback.submitter_email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic">Anonymous</span>
                    )}
                  </div>
                  <div className="border-t border-border-light dark:border-border-dark my-2"></div>
                  <Row
                    label="Page"
                    value={
                      <a
                        href={feedback.element_selector
                          ? `${feedback.page_url}#fb-marker=${encodeURIComponent(feedback.element_selector)}`
                          : feedback.page_url
                        }
                        target="_blank"
                        className="text-primary dark:text-[#de6bc0] truncate hover:underline"
                      >
                        {feedback.page_url}
                      </a>
                    }
                  />
                  <Row label="Submitted" value={formattedDate} />
                  {(feedback.browser || feedback.os || feedback.viewport_width) && (
                    <Row
                      label="Device"
                      value={[
                        feedback.browser,
                        feedback.os,
                        feedback.viewport_width ? `${feedback.viewport_width}×${feedback.viewport_height}` : null
                      ].filter(Boolean).join(' · ')}
                    />
                  )}
                  {feedback.element_selector && (
                    <>
                      <div className="border-t border-border-light dark:border-border-dark my-2"></div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Element</span>
                        <code className="block mt-1 text-xs text-gray-600 dark:text-gray-300 bg-card-light dark:bg-card-dark rounded-lg p-2 overflow-x-auto">
                          {feedback.element_selector}
                        </code>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Comments {comments.length > 0 && `(${comments.length})`}
            </label>

            {/* Comments List */}
            <div className="mt-3 space-y-3">
              {comments.map((comment) => {
                const member = comment.team_member
                const isOwnComment = currentMember?.id === comment.team_member_id
                const commentDate = new Date(comment.created_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })

                return (
                  <div key={comment.id} className="flex gap-3 group">
                    {member?.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center text-white text-sm font-semibold shrink-0">
                        {member?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="rounded-xl px-4 py-3 bg-[#f4f5f6] dark:bg-slate-800 border border-[#ccc] dark:border-slate-600">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {member?.name || 'Unknown'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{commentDate}</span>
                            {isOwnComment && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                                title="Delete comment"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {linkifyText(comment.content)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {comments.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic py-2">No comments yet</p>
              )}
            </div>

            {/* Add Comment Form */}
            {currentMember && (
              <form onSubmit={handleAddComment} className="mt-4 flex gap-3">
                {currentMember.avatar_url ? (
                  <img
                    src={currentMember.avatar_url}
                    alt={currentMember.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    {currentMember.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="input flex-1"
                  />
                  <button
                    type="submit"
                    disabled={addingComment || !newComment.trim()}
                    className="btn-primary px-4 disabled:opacity-50"
                  >
                    {addingComment ? '...' : 'Post'}
                  </button>
                </div>
              </form>
            )}

            {!currentMember && (
              <p className="mt-3 text-sm text-gray-400 dark:text-gray-500 italic">
                You must be a team member to add comments
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {currentIndex + 1} of {columnFeedback.length} in column
            </span>
            {isSubmitter && !showDeleteConfirm && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
            {isSubmitter && showDeleteConfirm && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500 dark:text-red-400">Delete this feedback?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Yes'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  No
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            <button onClick={handleSaveAndClose} disabled={saving} className="btn-outline disabled:opacity-50">
              {saving ? 'Saving...' : 'Save & Close'}
            </button>
            <button
              onClick={handleSaveAndNext}
              disabled={saving || !nextFeedback}
              className="btn-primary disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? 'Saving...' : 'Save & Next'}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        </div>

        {/* Next Arrow */}
        <button
          onClick={handleNext}
          disabled={!nextFeedback}
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            nextFeedback
              ? 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 shadow-lg'
              : 'bg-white/50 dark:bg-slate-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
    </>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-900 dark:text-white text-right truncate">{value}</span>
    </div>
  )
}
