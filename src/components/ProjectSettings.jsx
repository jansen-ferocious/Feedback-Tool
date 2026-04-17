import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProjectSettings({ project, onUpdate }) {
  const navigate = useNavigate()
  const [name, setName] = useState(project.name)
  const [domain, setDomain] = useState(project.domain || '')
  const [widgetActive, setWidgetActive] = useState(project.widget_active !== false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [members, setMembers] = useState([])
  const [devAssignee, setDevAssignee] = useState(project.dev_assignee_id || '')
  const [contentAssignee, setContentAssignee] = useState(project.content_assignee_id || '')
  const [savingAssignees, setSavingAssignees] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('name')

    if (!error && data) {
      setMembers(data)
    }
  }

  const devMembers = members.filter(m => m.team === 'Dev')
  const contentMembers = members.filter(m => m.team === 'Content')

  async function handleSaveAssignees() {
    setSavingAssignees(true)

    const oldDevAssignee = project.dev_assignee_id || null
    const oldContentAssignee = project.content_assignee_id || null
    const newDevAssignee = devAssignee || null
    const newContentAssignee = contentAssignee || null

    // Update the project assignees
    const { error } = await supabase
      .from('projects')
      .update({
        dev_assignee_id: newDevAssignee,
        content_assignee_id: newContentAssignee,
      })
      .eq('id', project.id)

    if (error) {
      console.error('Error updating assignees:', error)
      alert('Failed to update assignees')
      setSavingAssignees(false)
      return
    }

    // Reassign existing feedback if dev assignee changed
    if (oldDevAssignee !== newDevAssignee && oldDevAssignee) {
      const { error: devError } = await supabase
        .from('feedback')
        .update({ assigned_to: newDevAssignee })
        .eq('project_id', project.id)
        .eq('assigned_to', oldDevAssignee)
        .in('status', ['not_started', 'in_progress'])

      if (devError) {
        console.error('Error reassigning dev feedback:', devError)
      }
    }

    // Reassign existing feedback if content assignee changed
    if (oldContentAssignee !== newContentAssignee && oldContentAssignee) {
      const { error: contentError } = await supabase
        .from('feedback')
        .update({ assigned_to: newContentAssignee })
        .eq('project_id', project.id)
        .eq('assigned_to', oldContentAssignee)
        .in('status', ['not_started', 'in_progress'])

      if (contentError) {
        console.error('Error reassigning content feedback:', contentError)
      }
    }

    onUpdate()
    setSavingAssignees(false)
  }

  async function fetchFaviconFromPage(domainUrl) {
    try {
      // Ensure domain has protocol
      const url = domainUrl.startsWith('http') ? domainUrl : `https://${domainUrl}`
      console.log('Fetching favicon from:', url)

      // Use a CORS proxy to fetch the page
      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`)
      if (!response.ok) {
        console.log('Fetch failed with status:', response.status)
        return null
      }

      const html = await response.text()
      console.log('Got HTML, length:', html.length)

      // Parse HTML to find favicon link tags
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      // Look for various favicon link types, prioritizing larger icons
      const selectors = [
        'link[rel="icon"][sizes="192x192"]',
        'link[rel="icon"][sizes="180x180"]',
        'link[rel="icon"][sizes="128x128"]',
        'link[rel="apple-touch-icon"]',
        'link[rel="icon"][type="image/png"]',
        'link[rel="shortcut icon"]',
        'link[rel="icon"]',
      ]

      for (const selector of selectors) {
        const link = doc.querySelector(selector)
        if (link) {
          let href = link.getAttribute('href')
          console.log('Found icon with selector', selector, ':', href)
          if (href) {
            // Convert relative URLs to absolute
            if (href.startsWith('//')) {
              href = 'https:' + href
            } else if (href.startsWith('/')) {
              const baseUrl = new URL(url)
              href = baseUrl.origin + href
            } else if (!href.startsWith('http')) {
              const baseUrl = new URL(url)
              href = baseUrl.origin + '/' + href
            }
            console.log('Resolved icon URL:', href)
            return href
          }
        }
      }

      console.log('No favicon found in HTML')
      return null
    } catch (error) {
      console.error('Error fetching favicon:', error)
      return null
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)

    // Build update object
    const updateData = { name, domain, widget_active: widgetActive }

    // Try to fetch favicon from the page, fall back to Google service
    if (domain) {
      const fetchedIcon = await fetchFaviconFromPage(domain)
      updateData.icon_url = fetchedIcon || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      console.log('Saving icon_url:', updateData.icon_url)
    } else {
      updateData.icon_url = null
    }

    console.log('Saving project data:', updateData)
    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', project.id)

    if (error) {
      console.error('Error updating project:', error)
      // If icon_url column doesn't exist, retry without it
      const errorStr = JSON.stringify(error)
      if (errorStr.includes('icon_url') || error.code === '42703' || error.code === 'PGRST204') {
        console.log('Retrying without icon_url...')
        const { error: retryError } = await supabase
          .from('projects')
          .update({ name, domain })
          .eq('id', project.id)

        if (retryError) {
          alert('Failed to update project')
          setSaving(false)
          return
        }
      } else {
        // Try without icon_url anyway as fallback
        console.log('Retrying without icon_url as fallback...')
        const { error: retryError } = await supabase
          .from('projects')
          .update({ name, domain })
          .eq('id', project.id)

        if (retryError) {
          alert('Failed to update project: ' + error.message)
          setSaving(false)
          return
        }
      }
    }

    onUpdate()
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.id)

    if (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    } else {
      navigate('/')
    }
  }

  function copyEmbedCode() {
    const embedCode = `<script src="${window.location.origin}/widget.min.js" data-project="${project.api_key}"></script>`
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const embedCode = `<script src="${window.location.origin}/widget.min.js" data-project="${project.api_key}"></script>`

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General Settings & Embed Code */}
        <div className="card bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="font-medium text-gray-900 dark:text-white">General</h2>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  id="projectName"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label htmlFor="projectDomain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Domain
                </label>
                <input
                  type="text"
                  id="projectDomain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="input w-full"
                  placeholder="example.com"
                />
              </div>

              {/* Widget Active Toggle */}
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Widget Active</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Show feedback widget on the website</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWidgetActive(!widgetActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    widgetActive ? '' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  style={widgetActive ? { backgroundColor: '#9865e3' } : {}}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      widgetActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>

            {/* Embed Code Section */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Embed Code</span>
              </div>
              <textarea
                readOnly
                value={embedCode}
                rows={3}
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 font-mono border border-gray-200 dark:border-gray-700 resize-none"
              />
              <button
                onClick={copyEmbedCode}
                className="btn-outline text-sm mt-3"
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Assignments */}
        <div className="card bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="font-medium text-gray-900 dark:text-white">Auto-Assign Feedback</h2>
            </div>

            <div className="space-y-4">
            {/* Dev Assignee */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
              <div className="mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Dev Feedback Assignee
                </span>
              </div>
              {devMembers.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 text-center">
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    No Dev team members yet
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <label
                    className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 cursor-pointer transition-all ${
                      devAssignee === ''
                        ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/40'
                        : 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-50'
                    }`}
                  >
                    <input type="radio" name="devAssignee" value="" checked={devAssignee === ''} onChange={(e) => setDevAssignee(e.target.value)} className="sr-only" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">None</span>
                  </label>
                  {devMembers.map((member) => {
                    const isSelected = devAssignee === member.id
                    const hasSelection = devAssignee !== ''
                    return (
                      <label
                        key={member.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/40'
                            : hasSelection
                              ? 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-50'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                        title={member.name}
                      >
                        <input type="radio" name="devAssignee" value={member.id} checked={isSelected} onChange={(e) => setDevAssignee(e.target.value)} className="sr-only" />
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.name} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold bg-gradient-to-br from-blue-500 to-blue-600">
                            {member.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{member.name?.split(' ')[0]}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Content Assignee */}
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50">
              <div className="mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Content Feedback Assignee
                </span>
              </div>
              {contentMembers.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 text-center">
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    No Content team members yet
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <label
                    className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 cursor-pointer transition-all ${
                      contentAssignee === ''
                        ? 'border-green-500 bg-green-100 dark:bg-green-900/40'
                        : 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-50'
                    }`}
                  >
                    <input type="radio" name="contentAssignee" value="" checked={contentAssignee === ''} onChange={(e) => setContentAssignee(e.target.value)} className="sr-only" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">None</span>
                  </label>
                  {contentMembers.map((member) => {
                    const isSelected = contentAssignee === member.id
                    const hasSelection = contentAssignee !== ''
                    return (
                      <label
                        key={member.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-100 dark:bg-green-900/40'
                            : hasSelection
                              ? 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-50'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                        title={member.name}
                      >
                        <input type="radio" name="contentAssignee" value={member.id} checked={isSelected} onChange={(e) => setContentAssignee(e.target.value)} className="sr-only" />
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.name} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold bg-gradient-to-br from-green-500 to-green-600">
                            {member.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{member.name?.split(' ')[0]}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleSaveAssignees}
              disabled={savingAssignees}
              className="btn-primary disabled:opacity-50 mt-4"
            >
              {savingAssignees ? 'Saving...' : 'Save Auto-Assign'}
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-200 dark:border-red-900/50">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h2 className="font-medium text-red-500">Delete Project</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Permanently remove this project and all feedback</p>
              </div>
            </div>
            <button
              onClick={handleDelete}
              className="btn-outline text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
