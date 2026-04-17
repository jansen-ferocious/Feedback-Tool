import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'ignored', label: 'Ignored' },
]

export default function FeedbackModal({ feedback, teamMembers, onClose, onUpdate, columnFeedback = [], onNavigate }) {
  const [status, setStatus] = useState(feedback.status)
  const [assignedTo, setAssignedTo] = useState(feedback.assigned_to || '')
  const [saving, setSaving] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Find current index and navigation targets
  const currentIndex = columnFeedback.findIndex(f => f.id === feedback.id)
  const prevFeedback = currentIndex > 0 ? columnFeedback[currentIndex - 1] : null
  const nextFeedback = currentIndex < columnFeedback.length - 1 ? columnFeedback[currentIndex + 1] : null

  // Reset form when feedback changes
  useEffect(() => {
    setStatus(feedback.status)
    setAssignedTo(feedback.assigned_to || '')
  }, [feedback.id])

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

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      {/* Previous Arrow */}
      <button
        onClick={handlePrev}
        disabled={!prevFeedback}
        className={`absolute left-4 lg:left-8 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          prevFeedback
            ? 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 shadow-lg'
            : 'bg-white/50 dark:bg-slate-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next Arrow */}
      <button
        onClick={handleNext}
        disabled={!nextFeedback}
        className={`absolute right-4 lg:right-8 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          nextFeedback
            ? 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 shadow-lg'
            : 'bg-white/50 dark:bg-slate-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4">
                  <p className="text-gray-900 dark:text-white leading-relaxed">
                    {feedback.comment}
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
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Submitted By</label>
                <div className="mt-2 bg-surface-light dark:bg-surface-dark rounded-xl p-4 text-sm">
                  {feedback.submitter_name || feedback.submitter_email ? (
                    <div className="flex items-center gap-3">
                      {feedback.submitter_avatar_url ? (
                        <img
                          src={feedback.submitter_avatar_url}
                          alt={feedback.submitter_name || 'Submitter'}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-semibold shrink-0">
                          {feedback.submitter_name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="space-y-0.5">
                        {feedback.submitter_name && <p className="font-medium text-gray-900 dark:text-white">{feedback.submitter_name}</p>}
                        {feedback.submitter_email && <p className="text-gray-500 dark:text-gray-400">{feedback.submitter_email}</p>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 italic">Anonymous</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Details</label>
                <div className="mt-2 bg-surface-light dark:bg-surface-dark rounded-xl p-4 space-y-2 text-sm">
                  <Row
                    label="Page"
                    value={
                      <a
                        href={feedback.element_selector
                          ? `${feedback.page_url}#fb-marker=${encodeURIComponent(feedback.element_selector)}`
                          : feedback.page_url
                        }
                        target="_blank"
                        className="text-primary truncate hover:underline"
                      >
                        {feedback.page_url}
                      </a>
                    }
                  />
                  <Row label="Submitted" value={formattedDate} />
                  {feedback.browser && <Row label="Browser" value={feedback.browser} />}
                  {feedback.os && <Row label="OS" value={feedback.os} />}
                  {feedback.viewport_width && <Row label="Viewport" value={`${feedback.viewport_width} x ${feedback.viewport_height}`} />}
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-light dark:border-border-dark">
          <span className="text-xs text-gray-400">
            {currentIndex + 1} of {columnFeedback.length} in column
          </span>
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
