import { useDraggable } from '@dnd-kit/core'

export default function FeedbackCard({ feedback, onClick, isDragging }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: feedback.id,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  const formattedDate = new Date(feedback.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all border ${
        isDragging
          ? 'shadow-lg ring-2 ring-primary scale-105 bg-white dark:bg-slate-700 border-primary'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500'
      }`}
    >
      {feedback.screenshot_url && (
        <div className="mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={feedback.screenshot_url}
            alt=""
            className="w-full h-20 object-cover"
            draggable={false}
          />
        </div>
      )}

      <p className="text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">
        {feedback.comment || 'No comment'}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="truncate max-w-[100px]">
          {feedback.page_url ? new URL(feedback.page_url).pathname : '/'}
        </span>
        <span>{formattedDate}</span>
      </div>

      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border-light dark:border-border-dark">
        {/* Submitter */}
        <div className="flex items-center gap-1.5 min-w-0">
          {feedback.submitter_avatar_url ? (
            <img
              src={feedback.submitter_avatar_url}
              alt={feedback.submitter_name || 'Submitter'}
              className="w-5 h-5 rounded-full object-cover shrink-0"
              draggable={false}
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
              {feedback.submitter_name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {feedback.submitter_name || 'Anonymous'}
          </span>
        </div>

        {/* Assignee */}
        {feedback.assigned_member ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-gray-400">→</span>
            {feedback.assigned_member.avatar_url ? (
              <img
                src={feedback.assigned_member.avatar_url}
                alt={feedback.assigned_member.name}
                className="w-5 h-5 rounded-full object-cover shrink-0"
                draggable={false}
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                {feedback.assigned_member.name?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {feedback.assigned_member.name?.split(' ')[0]}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-300 dark:text-gray-600 italic">Unassigned</span>
        )}
      </div>
    </div>
  )
}
