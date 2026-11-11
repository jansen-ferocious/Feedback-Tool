import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import KanbanBoard from '../components/KanbanBoard'
import ProjectSettings from '../components/ProjectSettings'
import ProjectTasks from '../components/ProjectTasks'

export default function Project() {
  const { projectId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = new URLSearchParams(window.location.search).get('tab')
    return tabParam === 'tasks' || tabParam === 'settings' ? tabParam : 'feedback'
  })

  // Filter/sort state lifted up for toolbar
  const [sortOrder, setSortOrder] = useState('newest')
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [filterPageUrl, setFilterPageUrl] = useState('all')
  const [pageUrls, setPageUrls] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [feedbackStats, setFeedbackStats] = useState({ filtered: 0, total: 0, completed: 0, completionPercent: 0, memberStats: [] })
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, tasks: [] })
  const [currentUserMemberId, setCurrentUserMemberId] = useState(null)
  const [exportModal, setExportModal] = useState({ open: false, text: '', count: 0, loading: false, copied: false })

  useEffect(() => {
    fetchProject()
    fetchTeamMembers()
    fetchTaskStats()
  }, [projectId])

  // Export all not-started feedback as plain text to paste into Claude
  async function handleExportToClaude() {
    setExportModal({ open: true, text: '', count: 0, loading: true, copied: false })

    const { data, error } = await supabase
      .from('feedback')
      .select('comment, page_url, browser, os, viewport_width, viewport_height, element_selector, element_html, created_at')
      .eq('project_id', projectId)
      .eq('status', 'not_started')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error exporting feedback:', error)
      setExportModal({ open: true, text: 'Failed to load feedback for export.', count: 0, loading: false, copied: false })
      return
    }

    const items = data || []
    const header = `Feedback export — ${project.name}${project.domain ? ` (${project.domain})` : ''}\n${items.length} not-started feedback item${items.length !== 1 ? 's' : ''}`

    const body = items.map((f, i) => {
      const device = [
        [f.browser, f.os].filter(Boolean).join(' on '),
        (f.viewport_width && f.viewport_height) ? `${f.viewport_width}×${f.viewport_height}` : null,
      ].filter(Boolean).join(' · ') || '—'
      const element = f.element_selector || f.element_html || '—'
      return `${i + 1}. ${f.comment || '(no comment)'}\n   Page: ${f.page_url || '—'}\n   Device: ${device}\n   Element: ${element}`
    }).join('\n\n')

    const text = items.length
      ? `${header}\n\n${body}`
      : `${header}\n\nNo not-started feedback items to export.`

    setExportModal({ open: true, text, count: items.length, loading: false, copied: false })
  }

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exportModal.text)
      setExportModal(prev => ({ ...prev, copied: true }))
      setTimeout(() => setExportModal(prev => ({ ...prev, copied: false })), 2000)
    } catch (e) {
      console.error('Copy failed:', e)
      alert('Copy failed — select the text and copy manually.')
    }
  }

  async function fetchTaskStats() {
    const { data } = await supabase
      .from('project_tasks')
      .select('id, status, assigned_to')
      .eq('project_id', projectId)

    if (data) {
      // Trackable statuses (not_started, in_progress, done, ignored). 'ignored' = Not Implemented, counts as complete.
      const trackable = data.filter(t =>
        t.status === 'not_started' || t.status === 'in_progress' || t.status === 'done' || t.status === 'ignored'
      )
      setTaskStats({
        total: trackable.length,
        completed: trackable.filter(t => t.status === 'done' || t.status === 'ignored').length,
        tasks: trackable // Include all tasks for per-member calculation
      })
    }
  }

  async function fetchProject() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('Error fetching project:', error)
    } else {
      setProject(data)
    }
    setLoading(false)
  }

  async function fetchTeamMembers() {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .order('name')
    setTeamMembers(data || [])

    if (user?.email && data) {
      const currentMember = data.find(m => m.email?.toLowerCase() === user.email.toLowerCase())
      if (currentMember) {
        setCurrentUserMemberId(currentMember.id)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Project not found</p>
        <Link to="/" className="btn-primary">Back to Dashboard</Link>
      </div>
    )
  }

  const tabs = [
    { id: 'feedback', name: 'Internal Feedback' },
    { id: 'tasks', name: 'Client Requested Tasks' },
    { id: 'settings', name: 'Settings' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {(project.icon_url || project.domain) ? (
              <img
                src={project.icon_url || `https://www.google.com/s2/favicons?domain=${project.domain}&sz=64`}
                alt=""
                className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 p-2"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-xl font-semibold ${(project.icon_url || project.domain) ? 'hidden' : ''}`}
            >
              {project.name[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{project.name}</h1>
                {project.archived && (
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Archived
                  </span>
                )}
              </div>
              {project.domain && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{project.domain}</p>
              )}
            </div>
          </div>

          {/* Progress Tracker */}
          {(feedbackStats.total > 0 || taskStats.total > 0) && (() => {
            // Combined stats
            const combinedTotal = feedbackStats.total + taskStats.total
            const combinedCompleted = feedbackStats.completed + taskStats.completed
            const combinedPercent = combinedTotal > 0 ? Math.round((combinedCompleted / combinedTotal) * 100) : 0

            // Calculate combined per-member stats (feedback + tasks)
            const combinedMemberStats = feedbackStats.memberStats.map(member => {
              const memberTasks = (taskStats.tasks || []).filter(t => t.assigned_to === member.id)
              const taskTotal = memberTasks.length
              const taskCompleted = memberTasks.filter(t => t.status === 'done' || t.status === 'ignored').length

              const totalCombined = member.total + taskTotal
              const completedCombined = member.completed + taskCompleted
              const percentCombined = totalCombined > 0 ? Math.round((completedCombined / totalCombined) * 100) : 0

              return {
                ...member,
                total: totalCombined,
                completed: completedCombined,
                percent: percentCombined
              }
            })

            // Also add members who only have tasks (no feedback)
            const feedbackMemberIds = feedbackStats.memberStats.map(m => m.id)
            const taskOnlyMembers = teamMembers
              .filter(m => !feedbackMemberIds.includes(m.id))
              .map(member => {
                const memberTasks = (taskStats.tasks || []).filter(t => t.assigned_to === member.id)
                const taskTotal = memberTasks.length
                const taskCompleted = memberTasks.filter(t => t.status === 'done' || t.status === 'ignored').length
                const percent = taskTotal > 0 ? Math.round((taskCompleted / taskTotal) * 100) : 0

                return {
                  ...member,
                  total: taskTotal,
                  completed: taskCompleted,
                  percent
                }
              })
              .filter(m => m.total > 0)

            const allMemberStats = [...combinedMemberStats, ...taskOnlyMembers]

            return (
            <div className="flex items-center gap-6">
              {/* Per-member progress */}
              {allMemberStats.length > 0 && (
                <div className="flex flex-col gap-2">
                  {allMemberStats.slice(0, 4).map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      {/* Avatar */}
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.name}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                          {member.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      {/* Name */}
                      <span className="text-xs text-gray-600 dark:text-gray-300 w-20 truncate">
                        {member.name?.split(' ')[0]}
                      </span>
                      {/* Progress bar */}
                      <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${member.percent}%` }}
                        />
                      </div>
                      {/* Stats */}
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-16">
                        {member.completed}/{member.total} ({member.percent}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Divider */}
              {allMemberStats.length > 0 && (
                <div className="h-12 w-px bg-slate-200 dark:bg-slate-700" />
              )}

              {/* Overall completion */}
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-slate-200 dark:text-slate-700"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${combinedPercent} 100`}
                      strokeLinecap="round"
                      className="text-emerald-500"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-200">
                    {combinedPercent}%
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {combinedCompleted}/{combinedTotal}
                  </div>
                  <div className="text-xs text-gray-400">total</div>
                </div>
              </div>
            </div>
            )
          })()}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Sort & Filter - only on feedback tab, right aligned */}
        {activeTab === 'feedback' && (
          <div className="flex items-center gap-4 ml-auto">
            {/* Export to Claude */}
            <button
              onClick={handleExportToClaude}
              title="Export not-started feedback as text to paste into Claude"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Export to Claude
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 hidden sm:block" />

            {/* Item count */}
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <span className="font-medium text-gray-600 dark:text-gray-300">{feedbackStats.filtered}</span>
              <span>item{feedbackStats.filtered !== 1 ? 's' : ''}</span>
              {(filterAssignee !== 'all' || filterPageUrl !== 'all') && (
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">filtered</span>
              )}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 hidden sm:block" />

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-800">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="text-sm bg-transparent border-none text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer pr-6"
              >
                <option value="newest">Sort By: Newest</option>
                <option value="oldest">Sort By: Oldest</option>
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-800">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="text-sm bg-transparent border-none text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer pr-6"
              >
                <option value="all">Assigned To: All</option>
                {currentUserMemberId && <option value="me">Mine</option>}
                <option value="unassigned">Unassigned</option>
                {teamMembers
                  .filter(member => member.id !== currentUserMemberId)
                  .map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
              </select>
            </div>

            {pageUrls.length > 1 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-800">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <select
                  value={filterPageUrl}
                  onChange={(e) => setFilterPageUrl(e.target.value)}
                  className="text-sm bg-transparent border-none text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer pr-6 max-w-[200px]"
                >
                  <option value="all">All Pages</option>
                  {pageUrls.map((url) => (
                    <option key={url} value={url}>{new URL(url).pathname || '/'}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'feedback' && (
        <KanbanBoard
          projectId={projectId}
          sortOrder={sortOrder}
          filterAssignee={filterAssignee}
          filterPageUrl={filterPageUrl}
          currentUserMemberId={currentUserMemberId}
          teamMembers={teamMembers}
          onCountChange={setFeedbackStats}
          onPageUrlsChange={setPageUrls}
          initialFeedbackId={searchParams.get('feedback')}
          onFeedbackOpened={() => {
            // Clear the feedback param from URL once opened
            searchParams.delete('feedback')
            setSearchParams(searchParams, { replace: true })
          }}
        />
      )}
      {activeTab === 'tasks' && (
        <ProjectTasks
          project={project}
          teamMembers={teamMembers}
          onStatsChange={setTaskStats}
          initialTaskId={searchParams.get('task')}
          onTaskOpened={() => {
            searchParams.delete('task')
            setSearchParams(searchParams, { replace: true })
          }}
        />
      )}
      {activeTab === 'settings' && <ProjectSettings project={project} onUpdate={fetchProject} />}

      {/* Export to Claude Modal */}
      {exportModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl p-6 flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Export to Claude</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {exportModal.loading
                    ? 'Loading…'
                    : `${exportModal.count} not-started item${exportModal.count !== 1 ? 's' : ''} — copy and paste into Claude`}
                </p>
              </div>
              <button
                onClick={() => setExportModal(prev => ({ ...prev, open: false }))}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {exportModal.loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <textarea
                readOnly
                value={exportModal.text}
                onFocus={(e) => e.target.select()}
                className="input flex-1 min-h-[300px] font-mono text-xs leading-relaxed resize-none"
              />
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setExportModal(prev => ({ ...prev, open: false }))}
                className="btn-ghost flex-1"
              >
                Close
              </button>
              <button
                onClick={copyExport}
                disabled={exportModal.loading || exportModal.count === 0}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {exportModal.copied ? 'Copied!' : 'Copy to clipboard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
