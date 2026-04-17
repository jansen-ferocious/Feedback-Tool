import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

export default function Dashboard() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDomain, setNewProjectDomain] = useState('')
  const [creating, setCreating] = useState(false)

  const [teamMembers, setTeamMembers] = useState([])

  useEffect(() => {
    fetchProjects()
    fetchTeamMembers()
  }, [])

  async function fetchTeamMembers() {
    const { data } = await supabase
      .from('team_members')
      .select('*')
    setTeamMembers(data || [])
  }

  async function fetchProjects() {
    // Fetch projects with feedback details
    const { data: projectsData, error } = await supabase
      .from('projects')
      .select(`
        *,
        feedback(id, status, assigned_to, created_at)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
    } else {
      setProjects(projectsData || [])
    }
    setLoading(false)
  }

  // Helper to get team member by id
  function getMember(id) {
    return teamMembers.find(m => m.id === id)
  }

  // Helper to get assignee stats for a project
  function getAssigneeStats(project) {
    const feedback = project.feedback || []
    const devAssignee = getMember(project.dev_assignee_id)
    const contentAssignee = getMember(project.content_assignee_id)

    const devOpenCount = feedback.filter(f =>
      f.assigned_to === project.dev_assignee_id &&
      f.status !== 'done' && f.status !== 'ignored'
    ).length

    const contentOpenCount = feedback.filter(f =>
      f.assigned_to === project.content_assignee_id &&
      f.status !== 'done' && f.status !== 'ignored'
    ).length

    return { devAssignee, contentAssignee, devOpenCount, contentOpenCount }
  }

  // Helper to get most recent feedback date
  function getMostRecentFeedback(project) {
    const feedback = project.feedback || []
    if (feedback.length === 0) return null
    const sorted = [...feedback].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return sorted[0]?.created_at
  }

  // Format relative time
  function formatRelativeTime(dateStr) {
    if (!dateStr) return 'No feedback'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  async function createProject(e) {
    e.preventDefault()
    setCreating(true)

    // Build project data with icon_url if domain is set
    const projectData = {
      name: newProjectName,
      domain: newProjectDomain || null,
      user_id: user.id,
    }

    if (newProjectDomain) {
      projectData.icon_url = `https://www.google.com/s2/favicons?domain=${newProjectDomain}&sz=128`
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()

    if (error) {
      console.error('Error creating project:', error)
      alert(`Failed to create project: ${error.message}`)
      setCreating(false)
      return
    }

    if (!data || data.length === 0) {
      alert('Failed to create project.')
      setCreating(false)
      return
    }

    const project = data[0]

    await supabase.from('team_members').insert({
      project_id: project.id,
      user_id: user.id,
      name: user.user_metadata?.full_name || user.user_metadata?.name || 'Owner',
      email: user.email,
      role: 'owner',
    })

    setShowCreateModal(false)
    setNewProjectName('')
    setNewProjectDomain('')
    fetchProjects()
    setCreating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Good {getGreeting()}, {user?.user_metadata?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Here's what's happening with your projects
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Projects */}
      <div className="card card-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center">
          <h2 className="font-semibold text-gray-900 dark:text-white">Projects</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">{projects.length} total</span>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">No projects yet</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              Create your first project
            </button>
          </div>
        ) : (
          <div>
            {/* Header Row */}
            <div className="grid grid-cols-12 items-center gap-4 px-6 py-3 border-b border-border-light dark:border-border-dark text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <div className="col-span-4">Project</div>
              <div className="col-span-2 text-center">Dev</div>
              <div className="col-span-2 text-center">Content</div>
              <div className="col-span-2 text-center">Total</div>
              <div className="col-span-2 text-right pr-8">Latest Activity</div>
            </div>
            {/* Project Rows */}
            <div>
            {projects.map((project, index) => {
              const { devAssignee, contentAssignee, devOpenCount, contentOpenCount } = getAssigneeStats(project)
              const mostRecent = getMostRecentFeedback(project)
              const totalCount = project.feedback?.length || 0
              const doneCount = project.feedback?.filter(f => f.status === 'done').length || 0
              const donePercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

              return (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className={`grid grid-cols-12 items-center gap-4 px-6 py-5 hover:bg-primary/10 transition-colors ${
                    index !== projects.length - 1 ? 'border-b border-border-light dark:border-border-dark' : ''
                  } ${index % 2 === 1 ? 'bg-slate-50 dark:bg-white/5' : ''}`}
                >
                  {/* Project Icon & Name - 4 cols */}
                  <div className="col-span-4 flex items-center gap-4">
                    {(project.icon_url || project.domain) ? (
                      <img
                        src={project.icon_url || `https://www.google.com/s2/favicons?domain=${project.domain}&sz=64`}
                        alt=""
                        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 p-1.5 shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center text-white font-semibold shrink-0 ${(project.icon_url || project.domain) ? 'hidden' : ''}`}
                    >
                      {project.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{project.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {project.domain || 'No domain'}
                      </p>
                    </div>
                  </div>

                  {/* Dev Assignee - 2 cols */}
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    {devAssignee ? (
                      <>
                        {devAssignee.avatar_url ? (
                          <img src={devAssignee.avatar_url} alt={devAssignee.name} className="w-10 h-10 rounded-full object-cover" title={devAssignee.name} />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold" title={devAssignee.name}>
                            {devAssignee.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{devAssignee.name?.split(' ')[0]}</p>
                          <p className="text-xs text-gray-500">
                            <span className={`font-semibold ${devOpenCount > 0 ? 'text-blue-600 dark:text-blue-400' : ''}`}>{devOpenCount}</span> open
                          </p>
                        </div>
                      </>
                    ) : (
                      <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </div>

                  {/* Content Assignee - 2 cols */}
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    {contentAssignee ? (
                      <>
                        {contentAssignee.avatar_url ? (
                          <img src={contentAssignee.avatar_url} alt={contentAssignee.name} className="w-10 h-10 rounded-full object-cover" title={contentAssignee.name} />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-semibold" title={contentAssignee.name}>
                            {contentAssignee.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{contentAssignee.name?.split(' ')[0]}</p>
                          <p className="text-xs text-gray-500">
                            <span className={`font-semibold ${contentOpenCount > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>{contentOpenCount}</span> open
                          </p>
                        </div>
                      </>
                    ) : (
                      <span className="text-sm text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </div>

                  {/* Total Feedback - 2 cols */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span><span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span> items</span>
                      <span><span className="font-semibold text-emerald-600 dark:text-emerald-400">{doneCount}</span> done</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${donePercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-1">{donePercent}% complete</p>
                  </div>

                  {/* Most Recent - 2 cols */}
                  <div className="col-span-2 flex items-center justify-end gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formatRelativeTime(mostRecent)}
                      </p>
                      <p className="text-xs text-gray-400">last submission</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )
            })}
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Project</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={createProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="input"
                  placeholder="My Website"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Domain <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newProjectDomain}
                  onChange={(e) => setNewProjectDomain(e.target.value)}
                  className="input"
                  placeholder="example.com"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-ghost flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn-primary flex-1 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}
