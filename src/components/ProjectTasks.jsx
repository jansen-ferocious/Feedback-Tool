import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: 'bg-slate-400', lightColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-amber-500', lightColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'done', label: 'Done', color: 'bg-green-500', lightColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'needs_review', label: 'Needs Review', color: 'bg-purple-500', lightColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'ignored', label: 'Not Implemented', color: 'bg-gray-400', lightColor: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
]

function SimpleEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  function handleInput() {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  function execCommand(command, val = null) {
    document.execCommand(command, false, val)
    editorRef.current?.focus()
    handleInput()
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
      <div className="flex items-center gap-0.5 p-1.5 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700">
        <button type="button" onClick={() => execCommand('bold')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-sm" title="Bold">B</button>
        <button type="button" onClick={() => execCommand('italic')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 italic text-sm" title="Italic">I</button>
        <button type="button" onClick={() => execCommand('underline')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 underline text-sm" title="Underline">U</button>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" title="Bullet List">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <button type="button" onClick={() => { const url = prompt('Enter URL:'); if (url) execCommand('createLink', url) }} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" title="Link">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-3 min-h-[80px] text-sm text-gray-900 dark:text-white focus:outline-none"
        data-placeholder={placeholder}
      />
      <style>{`[contenteditable]:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }`}</style>
    </div>
  )
}

function Avatar({ member, size = 'sm' }) {
  const sizes = { sm: 'w-5 h-5 text-[10px]', md: 'w-6 h-6 text-xs', lg: 'w-8 h-8 text-sm' }
  if (!member) return null
  if (member.avatar_url) {
    return <img src={member.avatar_url} alt={member.name} className={`${sizes[size]} rounded-full object-cover`} />
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold`}>
      {member.name?.[0]?.toUpperCase()}
    </div>
  )
}

export default function ProjectTasks({ project, teamMembers, onStatsChange, initialTaskId, onTaskOpened }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkTasks, setBulkTasks] = useState('')
  const [bulkAssignee, setBulkAssignee] = useState('')
  const [newTask, setNewTask] = useState({ content: '', description: '', status: 'not_started', assigned_to: '', images: [] })
  const [adding, setAdding] = useState(false)
  const [uploadingNewTaskImage, setUploadingNewTaskImage] = useState(false)
  const [currentMember, setCurrentMember] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCompleted, setFilterCompleted] = useState('all')
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedTasks, setExpandedTasks] = useState(new Set())
  const [editingTask, setEditingTask] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [uploadingImage, setUploadingImage] = useState(false)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [assigneeDropdown, setAssigneeDropdown] = useState(null)
  const [statusDropdown, setStatusDropdown] = useState(null)
  const [comments, setComments] = useState({}) // { taskId: [comments] }
  const [newComment, setNewComment] = useState({}) // { taskId: text }
  const [commentImage, setCommentImage] = useState({}) // { taskId: url }
  const [addingComment, setAddingComment] = useState(false)
  const [uploadingCommentImage, setUploadingCommentImage] = useState(false)

  useEffect(() => {
    if (user?.email && teamMembers?.length > 0) {
      const member = teamMembers.find(m => m.email?.toLowerCase() === user.email.toLowerCase())
      setCurrentMember(member || null)
    }
  }, [user?.email, teamMembers])

  useEffect(() => { fetchTasks() }, [project.id])

  // Auto-expand task from notification link
  useEffect(() => {
    if (initialTaskId && tasks.length > 0) {
      const taskExists = tasks.some(t => t.id === initialTaskId)
      if (taskExists) {
        setExpandedTasks(prev => {
          const next = new Set(prev)
          next.add(initialTaskId)
          return next
        })
        // Fetch comments for the task
        fetchComments(initialTaskId)
        // Clear the URL parameter
        if (onTaskOpened) onTaskOpened()
      }
    }
  }, [initialTaskId, tasks])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (assigneeDropdown && !e.target.closest('.assignee-dropdown-container')) {
        setAssigneeDropdown(null)
      }
      if (statusDropdown && !e.target.closest('.status-dropdown-container')) {
        setStatusDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [assigneeDropdown, statusDropdown])

  async function fetchTasks() {
    const { data, error } = await supabase
      .from('project_tasks')
      .select(`
        *,
        completed_by_member:team_members!project_tasks_completed_by_fkey(id, name, avatar_url),
        created_by_member:team_members!project_tasks_created_by_fkey(id, name, avatar_url),
        assigned_to_member:team_members!project_tasks_assigned_to_fkey(id, name, avatar_url)
      `)
      .eq('project_id', project.id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })

    if (!error) setTasks(data || [])
    setLoading(false)
  }

  async function handleAddTask(e, keepOpen = false) {
    e.preventDefault()
    if (!newTask.content.trim() || !currentMember) return
    setAdding(true)
    const { error } = await supabase.from('project_tasks').insert({
      project_id: project.id,
      content: newTask.content.trim(),
      description: newTask.description || null,
      status: newTask.status,
      assigned_to: newTask.assigned_to || null,
      images: newTask.images.length > 0 ? newTask.images : null,
      created_by: currentMember.id
    })
    if (!error) {
      setNewTask({ content: '', description: '', status: 'not_started', assigned_to: '', images: [] })
      if (!keepOpen) setShowAddModal(false)
      fetchTasks()
    }
    setAdding(false)
  }

  async function handleBulkAddTasks() {
    if (!bulkTasks.trim() || !currentMember) return
    const lines = bulkTasks.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length === 0) return

    setAdding(true)
    const tasksToInsert = lines.map((content, idx) => ({
      project_id: project.id,
      content,
      status: 'not_started',
      assigned_to: bulkAssignee || null,
      created_by: currentMember.id,
      position: idx
    }))

    const { error } = await supabase.from('project_tasks').insert(tasksToInsert)
    if (!error) {
      setBulkTasks('')
      setBulkAssignee('')
      setShowAddModal(false)
      setBulkMode(false)
      fetchTasks()
    }
    setAdding(false)
  }

  async function handleNewTaskImageUpload(files) {
    if (!files?.length) return
    setUploadingNewTaskImage(true)
    const urls = []
    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      const isPdf = file.type === 'application/pdf'
      if ((!isImage && !isPdf) || file.size > 10 * 1024 * 1024) continue
      const ext = isPdf ? 'pdf' : file.type.split('/')[1]
      const filename = `task-new-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('screenshots').upload(filename, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('screenshots').getPublicUrl(filename)
        urls.push(publicUrl)
      }
    }
    if (urls.length) {
      setNewTask(prev => ({ ...prev, images: [...prev.images, ...urls] }))
    }
    setUploadingNewTaskImage(false)
  }

  function removeNewTaskImage(idx) {
    setNewTask(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))
  }

  async function handleToggleComplete(task) {
    const newCompleted = !task.completed
    const previousStatus = task.status
    await supabase.from('project_tasks').update({
      completed: newCompleted,
      completed_by: newCompleted ? currentMember?.id : null,
      completed_at: newCompleted ? new Date().toISOString() : null,
      status: newCompleted ? 'done' : (previousStatus === 'done' ? 'not_started' : previousStatus),
      updated_at: new Date().toISOString()
    }).eq('id', task.id)
    fetchTasks()
  }

  async function handleSaveTask(taskId) {
    const form = editForm[taskId]
    if (!form) return
    await supabase.from('project_tasks').update({
      content: form.content?.trim() || undefined,
      status: form.status,
      description: form.description,
      assigned_to: form.assigned_to || null,
      updated_at: new Date().toISOString()
    }).eq('id', taskId)
    setEditingTask(null)
    fetchTasks()
  }

  async function handleQuickStatus(taskId, newStatus) {
    const completed = newStatus === 'done'
    await supabase.from('project_tasks').update({
      status: newStatus,
      completed,
      completed_by: completed ? currentMember?.id : null,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }).eq('id', taskId)
    setStatusDropdown(null)
    fetchTasks()
  }

  async function handleDeleteTask(taskId) {
    if (!confirm('Delete this task?')) return
    await supabase.from('project_tasks').delete().eq('id', taskId)
    fetchTasks()
  }

  async function handleQuickAssign(taskId, memberId) {
    await supabase.from('project_tasks').update({
      assigned_to: memberId || null,
      updated_at: new Date().toISOString()
    }).eq('id', taskId)
    setAssigneeDropdown(null)
    fetchTasks()
  }

  async function handleImageUpload(task, files) {
    if (!files?.length) return
    setUploadingImage(true)
    const urls = []
    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      const isPdf = file.type === 'application/pdf'
      if ((!isImage && !isPdf) || file.size > 10 * 1024 * 1024) continue
      const ext = isPdf ? 'pdf' : file.type.split('/')[1]
      const filename = `task-${task.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('screenshots').upload(filename, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('screenshots').getPublicUrl(filename)
        urls.push(publicUrl)
      }
    }
    if (urls.length) {
      await supabase.from('project_tasks').update({ images: [...(task.images || []), ...urls], updated_at: new Date().toISOString() }).eq('id', task.id)
      fetchTasks()
    }
    setUploadingImage(false)
  }

  async function handleRemoveImage(task, idx) {
    const updatedImages = (task.images || []).filter((_, i) => i !== idx)
    await supabase.from('project_tasks').update({ images: updatedImages, updated_at: new Date().toISOString() }).eq('id', task.id)
    fetchTasks()
  }

  async function fetchComments(taskId) {
    const { data } = await supabase
      .from('task_comments')
      .select(`
        *,
        team_member:team_members(id, name, email, avatar_url)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (data) {
      setComments(prev => ({ ...prev, [taskId]: data }))
    }
  }

  async function uploadCommentImage(file) {
    if (!file) return null
    const isImage = file.type.startsWith('image/')
    if (!isImage || file.size > 5 * 1024 * 1024) return null

    const ext = file.type.split('/')[1]
    const filename = `task-comment-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('screenshots').upload(filename, file)
    if (error) return null

    const { data: { publicUrl } } = supabase.storage.from('screenshots').getPublicUrl(filename)
    return publicUrl
  }

  async function handleAddComment(task) {
    const text = newComment[task.id]?.trim()
    const imageUrl = commentImage[task.id]
    if (!text && !imageUrl) return
    if (!currentMember) return

    setAddingComment(true)

    const { error } = await supabase.from('task_comments').insert({
      task_id: task.id,
      team_member_id: currentMember.id,
      content: text || '',
      image_url: imageUrl || null
    })

    if (!error) {
      // Create notifications for task creator and assignee
      const notifyUserIds = []

      // Notify task creator if different from commenter
      if (task.created_by && task.created_by !== currentMember.id) {
        notifyUserIds.push(task.created_by)
      }

      // Notify assignee if different from commenter and creator
      if (task.assigned_to && task.assigned_to !== currentMember.id && task.assigned_to !== task.created_by) {
        notifyUserIds.push(task.assigned_to)
      }

      const commentPreview = text ? (text.length > 50 ? text.slice(0, 50) + '...' : text) : 'Added an image'

      for (const userId of notifyUserIds) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'comment',
          title: `${currentMember.name} commented on a task`,
          message: commentPreview,
          project_id: project.id,
          task_id: task.id,
          actor_id: currentMember.id
        })
      }

      setNewComment(prev => ({ ...prev, [task.id]: '' }))
      setCommentImage(prev => ({ ...prev, [task.id]: null }))
      fetchComments(task.id)
    }
    setAddingComment(false)
  }

  async function handleDeleteComment(taskId, commentId) {
    await supabase.from('task_comments').delete().eq('id', commentId)
    fetchComments(taskId)
  }

  async function handleCommentImageUpload(taskId, file) {
    if (!file) return
    setUploadingCommentImage(true)
    const url = await uploadCommentImage(file)
    if (url) {
      setCommentImage(prev => ({ ...prev, [taskId]: url }))
    }
    setUploadingCommentImage(false)
  }

  function startEditing(task) {
    setEditingTask(task.id)
    setEditForm(prev => ({ ...prev, [task.id]: { content: task.content, status: task.status, description: task.description || '', assigned_to: task.assigned_to || '' } }))
    if (!expandedTasks.has(task.id)) toggleExpanded(task.id)
  }

  function toggleExpanded(taskId) {
    setExpandedTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
        // Fetch comments when expanding
        if (!comments[taskId]) {
          fetchComments(taskId)
        }
      }
      return next
    })
  }

  function formatDate(d) {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function formatDateTime(d) {
    if (!d) return ''
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterCompleted === 'completed' && !t.completed) return false
    if (filterCompleted === 'pending' && t.completed) return false
    if (filterAssignee === 'me' && t.assigned_to !== currentMember?.id) return false
    if (filterAssignee === 'unassigned' && t.assigned_to) return false
    if (filterAssignee !== 'all' && filterAssignee !== 'me' && filterAssignee !== 'unassigned' && t.assigned_to !== filterAssignee) return false
    if (searchQuery && !t.content.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const groupedTasks = STATUS_OPTIONS.reduce((acc, s) => { acc[s.value] = filteredTasks.filter(t => t.status === s.value); return acc }, {})

  // Only count not_started and in_progress tasks for completion stats
  const trackableTasks = tasks.filter(t => t.status === 'not_started' || t.status === 'in_progress' || t.status === 'done')
  const completedCount = trackableTasks.filter(t => t.status === 'done').length
  const totalCount = trackableTasks.length
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Notify parent of stats changes (include tasks array for per-member calculations)
  useEffect(() => {
    if (onStatsChange) {
      const trackable = tasks.filter(t => t.status === 'not_started' || t.status === 'in_progress' || t.status === 'done')
      onStatsChange({
        total: trackable.length,
        completed: trackable.filter(t => t.status === 'done').length,
        tasks: trackable
      })
    }
  }, [tasks, onStatsChange])

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Task Progress</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{completedCount}/{totalCount} ({completionPercent}%)</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Add Task */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-800">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="text-sm bg-transparent border-none text-gray-700 dark:text-gray-300 focus:ring-0 focus:outline-none w-32 placeholder-gray-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-800">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm bg-transparent border-none text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer pr-6">
              <option value="all">Status: All</option>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-800">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <select value={filterCompleted} onChange={e => setFilterCompleted(e.target.value)} className="text-sm bg-transparent border-none text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer pr-6">
              <option value="all">Progress: All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-800">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className="text-sm bg-transparent border-none text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer pr-6">
              <option value="all">Assigned To: All</option>
              {currentMember && <option value="me">Mine</option>}
              <option value="unassigned">Unassigned</option>
              {teamMembers
                .filter(m => m.id !== currentMember?.id)
                .map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        {currentMember && (
          <div className="flex items-center gap-2">
            <button onClick={() => { setBulkMode(true); setShowAddModal(true) }} className="btn-outline px-4 py-1.5 flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              Bulk Add
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-primary px-4 py-1.5 flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Task
            </button>
          </div>
        )}
      </div>

      {/* Task Groups */}
      {STATUS_OPTIONS.map(statusOpt => {
        const statusTasks = groupedTasks[statusOpt.value]
        if (!statusTasks?.length) return null

        return (
          <div key={statusOpt.value}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${statusOpt.color}`} />
              <h3 className="font-semibold text-gray-900 dark:text-white">{statusOpt.label}</h3>
              <span className="text-sm text-gray-500">({statusTasks.filter(t => t.completed).length}/{statusTasks.length})</span>
            </div>

            <div className="space-y-2">
              {statusTasks.map(task => {
                const isExpanded = expandedTasks.has(task.id)
                const isEditing = editingTask === task.id
                const form = editForm[task.id] || {}
                const hasContent = task.description || task.images?.length

                return (
                  <div key={task.id} className={`card ${task.completed ? 'opacity-60' : ''}`}>
                    {/* Main Row */}
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Expand Button */}
                        <button onClick={() => toggleExpanded(task.id)} className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>

                        {/* Checkbox with Status Dropdown */}
                        <div className="flex items-center gap-0.5 status-dropdown-container relative">
                          <button onClick={() => handleToggleComplete(task)} className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600 hover:border-green-500'}`}>
                            {task.completed && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </button>
                          <button
                            onClick={() => setStatusDropdown(statusDropdown === task.id ? null : task.id)}
                            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>

                          {/* Status Dropdown */}
                          {statusDropdown === task.id && (
                            <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                              {STATUS_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => handleQuickStatus(task.id, opt.value)}
                                  className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${task.status === opt.value ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                                >
                                  <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                                  <span className="text-gray-700 dark:text-gray-300">{opt.label}</span>
                                  {task.status === opt.value && <svg className="w-3.5 h-3.5 text-primary ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <p className={`font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{task.content}</p>

                              {/* Meta Info */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                {task.created_by_member && (
                                  <span className="flex items-center gap-1.5">
                                    <Avatar member={task.created_by_member} size="sm" />
                                    <span>Added by {task.created_by_member.name}</span>
                                  </span>
                                )}
                                {task.completed && task.completed_by_member && (
                                  <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    {task.completed_by_member.name} · {formatDateTime(task.completed_at)}
                                  </span>
                                )}
                              </div>

                              {/* Indicators */}
                              {!isExpanded && (hasContent || comments[task.id]?.length > 0) && (
                                <div className="flex items-center gap-3 mt-2">
                                  {task.description && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>Notes</span>}
                                  {task.images?.length > 0 && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-xs text-purple-600 dark:text-purple-400">{task.images.length} image{task.images.length > 1 ? 's' : ''}</span>}
                                  {comments[task.id]?.length > 0 && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-xs text-blue-600 dark:text-blue-400"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>{comments[task.id].length} comment{comments[task.id].length > 1 ? 's' : ''}</span>}
                                </div>
                              )}
                            </div>

                            {/* Assignee, Actions & Date */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <div className="flex items-center gap-3">
                                {/* Assignee Avatar - ClickUp/Asana style - clickable dropdown */}
                                <div className="relative assignee-dropdown-container">
                                  <button
                                    onClick={() => setAssigneeDropdown(assigneeDropdown === task.id ? null : task.id)}
                                    className="focus:outline-none hover:ring-2 hover:ring-primary/50 rounded-full transition-all"
                                    title={task.assigned_to_member ? `Assigned to ${task.assigned_to_member.name} (click to change)` : 'Click to assign'}
                                  >
                                    {task.assigned_to_member ? (
                                      task.assigned_to_member.avatar_url ? (
                                        <img src={task.assigned_to_member.avatar_url} alt={task.assigned_to_member.name} className="w-7 h-7 rounded-full object-cover ring-2 ring-white dark:ring-slate-800" />
                                      ) : (
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white dark:ring-slate-800">
                                          {task.assigned_to_member.name?.[0]?.toUpperCase()}
                                        </div>
                                      )
                                    ) : (
                                      <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary flex items-center justify-center">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                      </div>
                                    )}
                                  </button>

                                  {/* Assignee Dropdown */}
                                  {assigneeDropdown === task.id && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                                      <button
                                        onClick={() => handleQuickAssign(task.id, null)}
                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${!task.assigned_to ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                                      >
                                        <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                                          <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </div>
                                        <span className="text-gray-500">Unassigned</span>
                                      </button>
                                      {/* Project assignees first */}
                                      {(() => {
                                        const projectAssigneeIds = [project.dev_assignee_id, project.content_assignee_id].filter(Boolean)
                                        const projectAssignees = teamMembers.filter(m => projectAssigneeIds.includes(m.id))
                                        const otherMembers = teamMembers.filter(m => !projectAssigneeIds.includes(m.id))

                                        return (
                                          <>
                                            {projectAssignees.length > 0 && (
                                              <>
                                                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Project Team</div>
                                                {projectAssignees.map(m => (
                                                  <button
                                                    key={m.id}
                                                    onClick={() => handleQuickAssign(task.id, m.id)}
                                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 bg-primary/5 ${task.assigned_to === m.id ? 'bg-primary/10' : ''}`}
                                                  >
                                                    <Avatar member={m} size="sm" />
                                                    <span className="text-gray-900 dark:text-white truncate">{m.name}</span>
                                                    <span className="text-[10px] text-gray-400 ml-auto">{m.id === project.dev_assignee_id ? 'Dev' : 'Content'}</span>
                                                    {task.assigned_to === m.id && <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                                  </button>
                                                ))}
                                                {otherMembers.length > 0 && <div className="border-t border-gray-100 dark:border-gray-700 my-1" />}
                                              </>
                                            )}
                                            {otherMembers.map(m => (
                                              <button
                                                key={m.id}
                                                onClick={() => handleQuickAssign(task.id, m.id)}
                                                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${task.assigned_to === m.id ? 'bg-primary/10' : ''}`}
                                              >
                                                <Avatar member={m} size="sm" />
                                                <span className="text-gray-900 dark:text-white truncate">{m.name}</span>
                                                {task.assigned_to === m.id && <svg className="w-4 h-4 text-primary ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                              </button>
                                            ))}
                                          </>
                                        )
                                      })()}
                                    </div>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-0.5">
                                  <button onClick={() => startEditing(task)} className="p-1.5 text-gray-400 hover:text-primary rounded" title="Edit">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  </button>
                                  <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded" title="Delete">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </div>
                              </div>
                              {/* Date below */}
                              <span className="text-xs text-gray-400">{formatDate(task.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Section */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/50 p-4">
                        {isEditing ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Task Title</label>
                              <input type="text" value={form.content || ''} onChange={e => setEditForm(p => ({ ...p, [task.id]: { ...p[task.id], content: e.target.value } }))} className="input w-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Status</label>
                                <select value={form.status || ''} onChange={e => setEditForm(p => ({ ...p, [task.id]: { ...p[task.id], status: e.target.value } }))} className="input w-full">
                                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Assigned To</label>
                                <select value={form.assigned_to || ''} onChange={e => setEditForm(p => ({ ...p, [task.id]: { ...p[task.id], assigned_to: e.target.value } }))} className="input w-full">
                                  <option value="">Unassigned</option>
                                  {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Description / Notes</label>
                              <SimpleEditor value={form.description || ''} onChange={v => setEditForm(p => ({ ...p, [task.id]: { ...p[task.id], description: v } }))} placeholder="Add details, instructions, or notes..." />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleSaveTask(task.id)} className="btn-primary px-4">Save Changes</button>
                              <button onClick={() => setEditingTask(null)} className="btn-ghost px-4">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Description & Images Row */}
                            <div className="flex gap-4">
                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Details</h4>
                                {task.description ? (
                                  <div className="prose prose-sm dark:prose-invert max-w-none bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700" dangerouslySetInnerHTML={{ __html: task.description }} />
                                ) : (
                                  <div className="text-sm text-gray-400 italic">No description</div>
                                )}
                              </div>

                              {/* Files */}
                              <div className="w-64 shrink-0">
                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Files</h4>
                                {task.images?.length > 0 ? (
                                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                                    {task.images.map((file, i) => {
                                      const isPdf = file.toLowerCase().endsWith('.pdf')
                                      return (
                                        <div key={i} className="relative group shrink-0 w-20 h-20">
                                          {isPdf ? (
                                            <a href={file} target="_blank" rel="noopener noreferrer" className="w-full h-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30">
                                              <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13h1c.55 0 1 .45 1 1v1c0 .55-.45 1-1 1h-.5v1H8v-4h.5zm3 0h1.5c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1H11v-4h.5zm4 0h2v.75h-1.25v.75h1v.75h-1v1.75h-.75V13z"/></svg>
                                              <span className="text-[10px] text-red-600 dark:text-red-400 mt-1">PDF</span>
                                            </a>
                                          ) : (
                                            <img src={file} alt="" className="w-full h-full object-cover rounded-lg cursor-pointer" onClick={() => setLightboxImage(file)} />
                                          )}
                                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                                            {isPdf ? (
                                              <a href={file} target="_blank" rel="noopener noreferrer" className="p-1 bg-white/20 rounded-full hover:bg-white/30 text-white"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>
                                            ) : (
                                              <button onClick={() => setLightboxImage(file)} className="p-1 bg-white/20 rounded-full hover:bg-white/30 text-white"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                            )}
                                            <button onClick={() => handleRemoveImage(task, i)} className="p-1 bg-white/20 rounded-full hover:bg-red-500 text-white"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-400 italic mb-2">No files</div>
                                )}
                                <label className="btn-outline text-xs px-2 py-1.5 cursor-pointer inline-flex items-center gap-1.5 mt-1">
                                  <input type="file" accept="image/*,.pdf" multiple onChange={e => handleImageUpload(task, e.target.files)} className="hidden" />
                                  {uploadingImage ? <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />Uploading...</> : <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Upload</>}
                                </label>
                              </div>
                            </div>

                            {/* Comments Section */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                Comments {comments[task.id]?.length > 0 && `(${comments[task.id].length})`}
                              </h4>

                              {/* Comments List */}
                              {comments[task.id]?.length > 0 && (
                                <div className="space-y-3 mb-4">
                                  {comments[task.id].map(comment => (
                                    <div key={comment.id} className="flex gap-3 group">
                                      {/* Avatar */}
                                      {comment.team_member?.avatar_url ? (
                                        <img src={comment.team_member.avatar_url} alt={comment.team_member.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                          {comment.team_member?.name?.[0]?.toUpperCase()}
                                        </div>
                                      )}
                                      {/* Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-sm font-medium text-gray-900 dark:text-white">{comment.team_member?.name}</span>
                                          <span className="text-xs text-gray-400">{formatDateTime(comment.created_at)}</span>
                                          {comment.team_member?.id === currentMember?.id && (
                                            <button
                                              onClick={() => handleDeleteComment(task.id, comment.id)}
                                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                                              title="Delete comment"
                                            >
                                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                          )}
                                        </div>
                                        {comment.content && (
                                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                                        )}
                                        {comment.image_url && (
                                          <img
                                            src={comment.image_url}
                                            alt=""
                                            className="mt-2 max-w-xs rounded-lg cursor-pointer hover:opacity-90"
                                            onClick={() => setLightboxImage(comment.image_url)}
                                          />
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add Comment Form */}
                              {currentMember && (
                                <div className="flex gap-3">
                                  {currentMember.avatar_url ? (
                                    <img src={currentMember.avatar_url} alt={currentMember.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                      {currentMember.name?.[0]?.toUpperCase()}
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="relative">
                                      <textarea
                                        value={newComment[task.id] || ''}
                                        onChange={e => setNewComment(prev => ({ ...prev, [task.id]: e.target.value }))}
                                        placeholder="Add a comment..."
                                        className="input w-full resize-none text-sm min-h-[80px]"
                                        onKeyDown={e => {
                                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                            handleAddComment(task)
                                          }
                                        }}
                                      />
                                    </div>
                                    {/* Image Preview */}
                                    {commentImage[task.id] && (
                                      <div className="relative inline-block mt-2">
                                        <img src={commentImage[task.id]} alt="" className="h-20 rounded-lg" />
                                        <button
                                          onClick={() => setCommentImage(prev => ({ ...prev, [task.id]: null }))}
                                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                        >
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between mt-2">
                                      <label className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={e => handleCommentImageUpload(task.id, e.target.files?.[0])}
                                        />
                                        {uploadingCommentImage ? (
                                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        )}
                                      </label>
                                      <button
                                        onClick={() => handleAddComment(task)}
                                        disabled={addingComment || (!newComment[task.id]?.trim() && !commentImage[task.id])}
                                        className="btn-primary px-3 py-1.5 text-sm disabled:opacity-50"
                                      >
                                        {addingComment ? 'Posting...' : 'Comment'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {filteredTasks.length === 0 && <div className="card p-12 text-center text-gray-500 dark:text-gray-400">{tasks.length === 0 ? 'No tasks yet. Add one above!' : 'No tasks match your filters.'}</div>}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowAddModal(false); setBulkMode(false) }}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{bulkMode ? 'Bulk Add Tasks' : 'Add New Task'}</h2>
              <button onClick={() => { setShowAddModal(false); setBulkMode(false) }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {bulkMode ? (
              /* Bulk Add Mode */
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Tasks (one per line) *
                  </label>
                  <textarea
                    value={bulkTasks}
                    onChange={e => setBulkTasks(e.target.value)}
                    placeholder="Paste or type tasks here, one per line...&#10;&#10;Example:&#10;Update homepage hero section&#10;Fix mobile navigation bug&#10;Add contact form validation"
                    className="input w-full h-48 resize-none font-mono text-sm"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    {bulkTasks.split('\n').filter(l => l.trim()).length} task{bulkTasks.split('\n').filter(l => l.trim()).length !== 1 ? 's' : ''} will be added
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Assign all tasks to</label>
                  <select
                    value={bulkAssignee}
                    onChange={e => setBulkAssignee(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">Unassigned</option>
                    {(() => {
                      const projectAssigneeIds = [project.dev_assignee_id, project.content_assignee_id].filter(Boolean)
                      const projectAssignees = teamMembers.filter(m => projectAssigneeIds.includes(m.id))
                      const otherMembers = teamMembers.filter(m => !projectAssigneeIds.includes(m.id))
                      return (
                        <>
                          {projectAssignees.length > 0 && (
                            <optgroup label="Project Team">
                              {projectAssignees.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.id === project.dev_assignee_id ? 'Dev' : 'Content'})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {otherMembers.length > 0 && (
                            <optgroup label="Other Members">
                              {otherMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </optgroup>
                          )}
                        </>
                      )
                    })()}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setShowAddModal(false); setBulkMode(false) }} className="btn-ghost px-4 py-2">Cancel</button>
                  <button
                    type="button"
                    onClick={handleBulkAddTasks}
                    disabled={adding || !bulkTasks.trim()}
                    className="btn-primary px-4 py-2 disabled:opacity-50"
                  >
                    {adding ? 'Adding...' : `Add ${bulkTasks.split('\n').filter(l => l.trim()).length} Tasks`}
                  </button>
                </div>
              </div>
            ) : (
              /* Single Task Mode */
              <form onSubmit={handleAddTask} className="p-4 space-y-4">
                {/* Task Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Task Title *</label>
                  <input
                    type="text"
                    value={newTask.content}
                    onChange={e => setNewTask(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter task title..."
                    className="input w-full"
                    autoFocus
                  />
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Assign To</label>
                  <select
                    value={newTask.assigned_to}
                    onChange={e => setNewTask(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="">Unassigned</option>
                    {(() => {
                      const projectAssigneeIds = [project.dev_assignee_id, project.content_assignee_id].filter(Boolean)
                      const projectAssignees = teamMembers.filter(m => projectAssigneeIds.includes(m.id))
                      const otherMembers = teamMembers.filter(m => !projectAssigneeIds.includes(m.id))
                      return (
                        <>
                          {projectAssignees.length > 0 && (
                            <optgroup label="Project Team">
                              {projectAssignees.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.id === project.dev_assignee_id ? 'Dev' : 'Content'})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {otherMembers.length > 0 && (
                            <optgroup label="Other Members">
                              {otherMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </optgroup>
                          )}
                        </>
                      )
                    })()}
                  </select>
                </div>

                {/* Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Details</label>
                  <SimpleEditor
                    value={newTask.description}
                    onChange={v => setNewTask(prev => ({ ...prev, description: v }))}
                    placeholder="Add details, instructions, or notes..."
                  />
                </div>

                {/* Attachments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Attachments</label>
                  {newTask.images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                      {newTask.images.map((file, i) => {
                        const isPdf = file.toLowerCase().endsWith('.pdf')
                        return (
                          <div key={i} className="relative group shrink-0 w-16 h-16">
                            {isPdf ? (
                              <div className="w-full h-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex flex-col items-center justify-center">
                                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z"/></svg>
                                <span className="text-[9px] text-red-600 dark:text-red-400">PDF</span>
                              </div>
                            ) : (
                              <img src={file} alt="" className="w-full h-full object-cover rounded-lg" />
                            )}
                            <button
                              type="button"
                              onClick={() => removeNewTaskImage(i)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <label className="btn-outline text-sm px-3 py-2 cursor-pointer inline-flex items-center gap-2">
                    <input type="file" accept="image/*,.pdf" multiple onChange={e => handleNewTaskImageUpload(e.target.files)} className="hidden" />
                    {uploadingNewTaskImage ? (
                      <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Uploading...</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Upload Files</>
                    )}
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost px-4 py-2">Cancel</button>
                  <button type="button" onClick={(e) => handleAddTask(e, true)} disabled={adding || !newTask.content.trim()} className="btn-outline px-4 py-2 disabled:opacity-50">
                    {adding ? 'Adding...' : 'Save & Add Another'}
                  </button>
                  <button type="submit" disabled={adding || !newTask.content.trim()} className="btn-primary px-4 py-2 disabled:opacity-50">
                    {adding ? 'Adding...' : 'Save & Close'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-8" onClick={() => setLightboxImage(null)}>
          <button onClick={() => setLightboxImage(null)} className="absolute top-4 right-4 text-white/80 hover:text-white"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          <a href={lightboxImage} download onClick={e => e.stopPropagation()} className="absolute top-4 right-16 text-white/80 hover:text-white" title="Download"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></a>
          <img src={lightboxImage} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
