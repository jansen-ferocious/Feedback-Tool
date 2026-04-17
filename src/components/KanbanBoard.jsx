import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { supabase } from '../lib/supabase'
import FeedbackCard from './FeedbackCard'
import FeedbackModal from './FeedbackModal'

const COLUMNS = [
  { id: 'not_started', title: 'Not Started', dotColor: 'bg-slate-300', borderColor: 'border-slate-200 dark:border-slate-700', gradient: 'from-slate-50 to-slate-100/50 dark:from-slate-800/40 dark:to-slate-800/20' },
  { id: 'in_progress', title: 'In Progress', dotColor: 'bg-amber-500', borderColor: 'border-amber-200 dark:border-amber-800/50', gradient: 'from-amber-50 to-orange-50/50 dark:from-amber-900/30 dark:to-amber-900/10' },
  { id: 'done', title: 'Done', dotColor: 'bg-emerald-500', borderColor: 'border-emerald-200 dark:border-emerald-800/50', gradient: 'from-emerald-50 to-green-50/50 dark:from-emerald-900/30 dark:to-emerald-900/10' },
  { id: 'ignored', title: 'Not Implemented', dotColor: 'bg-slate-500', borderColor: 'border-slate-300 dark:border-slate-600', gradient: 'from-slate-200 to-slate-100 dark:from-slate-700/60 dark:to-slate-700/30' },
]

export default function KanbanBoard({ projectId, sortOrder, filterAssignee, currentUserMemberId, teamMembers, onCountChange }) {
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  useEffect(() => {
    fetchFeedback()

    const channel = supabase
      .channel('feedback-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'feedback',
        filter: `project_id=eq.${projectId}`,
      }, () => fetchFeedback())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [projectId, teamMembers])

  async function fetchFeedback() {
    const { data } = await supabase
      .from('feedback')
      .select('*, assigned_member:team_members(id, name, email, avatar_url)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    // Match submitter emails to team members for avatar display
    const enrichedData = (data || []).map(item => {
      if (item.submitter_email && teamMembers) {
        const matchedMember = teamMembers.find(m => m.email?.toLowerCase() === item.submitter_email?.toLowerCase())
        if (matchedMember) {
          return {
            ...item,
            submitter_avatar_url: matchedMember.avatar_url,
            submitter_name: item.submitter_name || matchedMember.name
          }
        }
      }
      return item
    })

    setFeedback(enrichedData)
    setLoading(false)
  }

  // Apply sorting and filtering
  const filteredFeedback = (() => {
    let filtered = [...feedback]

    // Filter by assignee
    if (filterAssignee === 'me' && currentUserMemberId) {
      filtered = filtered.filter(f => f.assigned_to === currentUserMemberId)
    } else if (filterAssignee === 'unassigned') {
      filtered = filtered.filter(f => !f.assigned_to)
    } else if (filterAssignee && filterAssignee !== 'all') {
      filtered = filtered.filter(f => f.assigned_to === filterAssignee)
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at)
      const dateB = new Date(b.created_at)
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return filtered
  })()

  // Report stats back to parent
  useEffect(() => {
    // Calculate per-member stats
    const memberStats = teamMembers.map(member => {
      const memberFeedback = feedback.filter(f => f.assigned_to === member.id)
      const total = memberFeedback.length
      const completed = memberFeedback.filter(f => f.status === 'done').length
      const inProgress = memberFeedback.filter(f => f.status === 'in_progress').length
      const notStarted = memberFeedback.filter(f => f.status === 'not_started').length
      const open = inProgress + notStarted
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0

      return {
        ...member,
        total,
        completed,
        inProgress,
        notStarted,
        open,
        percent
      }
    }).filter(m => m.total > 0) // Only include members with assigned feedback

    // Calculate overall stats
    const total = feedback.length
    const completed = feedback.filter(f => f.status === 'done').length
    const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0

    onCountChange?.({
      filtered: filteredFeedback.length,
      total,
      completed,
      completionPercent,
      memberStats
    })
  }, [feedback, filteredFeedback.length, teamMembers, onCountChange])

  async function updateFeedbackStatus(feedbackId, newStatus) {
    await supabase.from('feedback').update({ status: newStatus }).eq('id', feedbackId)
  }

  function handleDragStart(event) {
    setActiveId(event.active.id)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const targetColumn = COLUMNS.find(col => col.id === over.id)
    if (targetColumn) {
      const item = feedback.find(f => f.id === active.id)
      if (item && item.status !== targetColumn.id) {
        setFeedback(prev => prev.map(f => f.id === active.id ? { ...f, status: targetColumn.id } : f))
        updateFeedbackStatus(active.id, targetColumn.id)
      }
    }
  }

  const activeFeedback = activeId ? feedback.find(f => f.id === activeId) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((column) => (
            <Column
              key={column.id}
              column={column}
              feedback={filteredFeedback.filter(f => f.status === column.id)}
              onCardClick={setSelectedFeedback}
            />
          ))}
        </div>
        <DragOverlay>
          {activeFeedback && <FeedbackCard feedback={activeFeedback} isDragging />}
        </DragOverlay>
      </DndContext>

      {selectedFeedback && (
        <FeedbackModal
          feedback={selectedFeedback}
          teamMembers={teamMembers}
          onClose={() => setSelectedFeedback(null)}
          onUpdate={fetchFeedback}
          columnFeedback={filteredFeedback.filter(f => f.status === selectedFeedback.status)}
          onNavigate={(feedback) => setSelectedFeedback(feedback)}
        />
      )}
    </>
  )
}

function Column({ column, feedback, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl p-4 min-h-[400px] transition-all border-2 bg-gradient-to-b ${column.gradient} ${column.borderColor} shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.2)] ${isOver ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{column.title}</h3>
        <span className="ml-auto text-xs font-medium text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded-full">
          {feedback.length}
        </span>
      </div>

      <div className="space-y-3">
        {feedback.map((item) => (
          <FeedbackCard key={item.id} feedback={item} onClick={() => onCardClick(item)} />
        ))}
        {feedback.length === 0 && (
          <div className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            isOver ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'
          }`}>
            <p className="text-sm text-gray-400">{isOver ? 'Drop here' : 'No items'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
