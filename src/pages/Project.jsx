import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import KanbanBoard from '../components/KanbanBoard'
import ProjectSettings from '../components/ProjectSettings'

export default function Project() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('feedback')

  // Filter/sort state lifted up for toolbar
  const [sortOrder, setSortOrder] = useState('newest')
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [filterPageUrl, setFilterPageUrl] = useState('all')
  const [pageUrls, setPageUrls] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [feedbackStats, setFeedbackStats] = useState({ filtered: 0, total: 0, completed: 0, completionPercent: 0, memberStats: [] })
  const [currentUserMemberId, setCurrentUserMemberId] = useState(null)

  useEffect(() => {
    fetchProject()
    fetchTeamMembers()
  }, [projectId])

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
      const currentMember = data.find(m => m.email === user.email)
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
    { id: 'feedback', name: 'Feedback' },
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
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{project.name}</h1>
              {project.domain && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{project.domain}</p>
              )}
            </div>
          </div>

          {/* Progress Tracker */}
          {feedbackStats.total > 0 && (
            <div className="flex items-center gap-6">
              {/* Per-member progress */}
              {feedbackStats.memberStats.length > 0 && (
                <div className="flex flex-col gap-2">
                  {feedbackStats.memberStats.slice(0, 4).map((member) => (
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
              {feedbackStats.memberStats.length > 0 && (
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
                      strokeDasharray={`${feedbackStats.completionPercent} 100`}
                      strokeLinecap="round"
                      className="text-emerald-500"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-200">
                    {feedbackStats.completionPercent}%
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {feedbackStats.completed}/{feedbackStats.total}
                  </div>
                  <div className="text-xs text-gray-400">total</div>
                </div>
              </div>
            </div>
          )}
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
        />
      )}
      {activeTab === 'settings' && <ProjectSettings project={project} onUpdate={fetchProject} />}
    </div>
  )
}
