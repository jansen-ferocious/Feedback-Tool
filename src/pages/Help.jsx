import { useState } from 'react'

const SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    icon: OverviewIcon,
    content: (
      <>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          The Feedback Dashboard is a platform for collecting and managing website feedback from your team. It consists of two main parts:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 mb-4">
          <li><strong>The Widget</strong> - A small button that appears on your website, allowing team members to submit feedback directly on any page.</li>
          <li><strong>The Dashboard</strong> - This web application where you manage, assign, and track all feedback submissions.</li>
        </ul>
        <p className="text-gray-600 dark:text-gray-300">
          Feedback items move through a simple workflow: <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-sm">Not Started</span> → <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-sm">In Progress</span> → <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-sm">Done</span>
        </p>
      </>
    ),
  },
  {
    id: 'submitting',
    title: 'Submitting Feedback',
    icon: SubmitIcon,
    content: (
      <>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          To submit feedback on a website with the widget installed:
        </p>
        <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-gray-300 mb-4">
          <li>
            <strong>Click the feedback button</strong> - Look for the purple button in the bottom-left corner of the website.
          </li>
          <li>
            <strong>Enter your details</strong> - On your first submission, you'll be asked for your name and email. This links your feedback to your account.
          </li>
          <li>
            <strong>Select an element</strong> - Your cursor will change to a crosshair. Click on the specific element you want to give feedback about.
          </li>
          <li>
            <strong>Add your comment</strong> - Describe the issue or suggestion. Be specific about what needs to change.
          </li>
          <li>
            <strong>Choose a category</strong> - Select "Dev" for UX issues or content changes on the homepage and pages under the About dropdown. Select "Content" for text/image changes on Service and Service Area pages. This auto-assigns feedback to the right team member per project.
          </li>
          <li>
            <strong>Submit</strong> - Click "Send" and your feedback will appear in the dashboard with a screenshot.
          </li>
        </ol>
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            <strong>Tip:</strong> Press <kbd className="px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-800 text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-800 text-xs">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-800 text-xs">F</kbd> to quickly start submitting feedback.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'managing',
    title: 'Managing Feedback',
    icon: ManageIcon,
    content: (
      <>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          The dashboard organizes feedback into a Kanban board with four columns:
        </p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
              <span className="font-medium text-sm text-gray-900 dark:text-white">Not Started</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">New feedback awaiting action</p>
          </div>
          <div className="rounded-lg p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="font-medium text-sm text-gray-900 dark:text-white">In Progress</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Currently being worked on</p>
          </div>
          <div className="rounded-lg p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="font-medium text-sm text-gray-900 dark:text-white">Done</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Completed feedback items</p>
          </div>
          <div className="rounded-lg p-3 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-slate-500"></div>
              <span className="font-medium text-sm text-gray-900 dark:text-white">Not Implemented</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Won't be addressed</p>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-3">
          <strong>Drag and drop</strong> cards between columns to update their status.
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          <strong>Click a card</strong> to view details, change assignment, add comments, or see the full screenshot.
        </p>
      </>
    ),
  },
  {
    id: 'assigning',
    title: 'Assigning & Filtering',
    icon: AssignIcon,
    content: (
      <>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Keep your team organized with assignments and filters:
        </p>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Auto-Assignment</h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          In website settings, set default assignees for Dev and Content feedback. New submissions will automatically be assigned based on the category selected.
        </p>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Manual Assignment</h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Click any feedback card and use the "Assign To" dropdown to reassign it to a different team member.
        </p>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Filtering</h4>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          Use the filters at the top of the dashboard to focus on specific feedback:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
          <li><strong>Assigned To</strong> - Filter by team member or show only your assignments</li>
          <li><strong>Page URL</strong> - Filter by the page where feedback was submitted</li>
          <li><strong>Sort</strong> - Order by newest or oldest first</li>
        </ul>
      </>
    ),
  },
  {
    id: 'comments',
    title: 'Comments & Collaboration',
    icon: CommentIcon,
    content: (
      <>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Use comments to collaborate with your team on feedback items:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 mb-4">
          <li>Open any feedback card to see the comments section at the bottom</li>
          <li>Add notes about progress, questions, or additional context</li>
          <li>Comments show who posted them and when</li>
          <li>You can delete your own comments if needed</li>
        </ul>
      </>
    ),
  },
  {
    id: 'widget-setup',
    title: 'Widget Setup',
    icon: CodeIcon,
    content: (
      <>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          To install the feedback widget on your website:
        </p>
        <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-gray-300 mb-4">
          <li>
            <strong>Go to your website settings</strong> - Click on a website from the Websites page, then click the gear icon.
          </li>
          <li>
            <strong>Copy the embed code</strong> - Find the script tag in the settings panel.
          </li>
          <li>
            <strong>Add to your website</strong> - Paste the script tag before the closing <code className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-sm">&lt;/body&gt;</code> tag on every page where you want feedback.
          </li>
        </ol>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          You can also toggle the widget on/off from the settings without removing the code.
        </p>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Note:</strong> The widget is designed for internal team use. Consider only enabling the widget during review periods.
          </p>
        </div>
      </>
    ),
  },
]

export default function Help() {
  const [activeSection, setActiveSection] = useState('overview')

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help Guide</h1>
          <p className="text-gray-500 dark:text-gray-400">Learn how to use the Feedback Dashboard</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <nav className="w-72 shrink-0">
          <div className="sticky top-6">
            <div className="card p-3">
              <ul className="space-y-1">
                {SECTIONS.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        activeSection === section.id
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <section.icon className="w-5 h-5 shrink-0" />
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1">
          <div className="card p-8">
            {SECTIONS.map((section) => (
              <div
                key={section.id}
                className={activeSection === section.id ? 'block' : 'hidden'}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{section.title}</h2>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need more help? Contact your team administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function OverviewIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function SubmitIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
    </svg>
  )
}

function ManageIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  )
}

function AssignIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function CommentIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function CodeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  )
}
