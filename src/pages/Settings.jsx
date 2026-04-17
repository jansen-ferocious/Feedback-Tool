import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth, useTheme } from '../App'

export default function Settings() {
  const { user } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
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

  async function handleSignOut() {
    setLoading(true)
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Settings</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Manage your account and preferences</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card - Larger, featured */}
        <div className="card lg:col-span-2">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              {memberData?.avatar_url ? (
                <img
                  src={memberData.avatar_url}
                  alt={memberData.name || 'User'}
                  className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-white dark:ring-gray-800"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white dark:ring-gray-800">
                  {memberData?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  {memberData?.name || user?.user_metadata?.name || user?.user_metadata?.full_name || 'User'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">{user?.email}</p>

                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  {memberData?.role && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium ${
                      memberData.role === 'Admin'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {memberData.role === 'Admin' && (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {memberData.role}
                    </span>
                  )}
                  {memberData?.team && (
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {memberData.team}
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Profile Link */}
              <a
                href="/users"
                className="btn-outline text-sm shrink-0"
              >
                Edit Profile
              </a>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="card">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white">Appearance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {darkMode ? 'Dark mode enabled' : 'Light mode enabled'}
                </p>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                  darkMode ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Session / Sign Out */}
        <div className="card">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center text-white shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white">Session</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sign out of your account</p>
              </div>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="btn-outline text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 shrink-0"
              >
                {loading ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="card lg:col-span-2">
          <div className="px-6 py-4 border-b border-border-light dark:border-border-dark">
            <h3 className="font-medium text-gray-900 dark:text-white">Account Information</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Email</p>
                <p className="text-sm text-gray-900 dark:text-white">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Account ID</p>
                <p className="text-sm text-gray-900 dark:text-white font-mono">{user?.id?.slice(0, 12)}...</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Provider</p>
                <p className="text-sm text-gray-900 dark:text-white capitalize">{user?.app_metadata?.provider || 'Email'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
