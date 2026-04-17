import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth, useTheme } from '../App'
import { supabase } from '../lib/supabase'

export default function Sidebar() {
  const location = useLocation()
  const { user } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const [memberData, setMemberData] = useState(null)

  useEffect(() => {
    if (user?.email) {
      fetchMemberData()
    }
  }, [user?.email])

  async function fetchMemberData() {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('email', user.email)
      .single()

    if (data) {
      setMemberData(data)
    }
  }

  const navigation = [
    { name: 'Websites', href: '/', icon: WebsitesIcon },
    { name: 'Users', href: '/users', icon: UsersIcon },
    { name: 'Account Settings', href: '/settings', icon: SettingsIcon },
  ]

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-slate-800" style={{ backgroundColor: '#10192b' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/10">
        <img src="/logo.png" alt="Spotted" className="h-24 w-auto" />
        <div className="flex flex-col">
          <span className="text-xl font-bold uppercase tracking-wide" style={{ color: '#fef6ff' }}>Feedback</span>
          <span className="text-xs italic font-semibold text-slate-400">
            Spotted By the Pride
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/15 text-white backdrop-blur-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-4 py-4 border-t border-white/10 space-y-3">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all w-full"
        >
          {darkMode ? (
            <>
              <SunIcon className="w-5 h-5" />
              Light Mode
            </>
          ) : (
            <>
              <MoonIcon className="w-5 h-5" />
              Dark Mode
            </>
          )}
        </button>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2">
          {memberData?.avatar_url ? (
            <img
              src={memberData.avatar_url}
              alt={memberData.name || 'User'}
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {memberData?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {memberData?.name || user?.user_metadata?.name || user?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function WebsitesIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  )
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function SettingsIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function MoonIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  )
}

function SunIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
