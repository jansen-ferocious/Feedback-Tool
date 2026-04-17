import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Project from './pages/Project'
import Users from './pages/Users'
import Settings from './pages/Settings'

const ALLOWED_DOMAIN = 'ferociousmedia.com'

const AuthContext = createContext(null)
const ThemeContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function useTheme() {
  return useContext(ThemeContext)
}

function isAllowedEmail(email) {
  return email && email.endsWith(`@${ALLOWED_DOMAIN}`)
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAllowedEmail(user.email)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

function Unauthorized() {
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark p-4">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
          Only @ferociousmedia.com accounts are allowed.
        </p>
        <button onClick={handleSignOut} className="btn-outline text-red-500 border-red-200 hover:bg-red-50">
          Sign Out
        </button>
      </div>
    </div>
  )
}

function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode(!darkMode)

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Ensure user exists in team_members table (matches pre-filled accounts by email)
  async function ensureTeamMember(authUser) {
    if (!authUser || !isAllowedEmail(authUser.email)) return

    // Check if user already exists by email
    const { data: existing } = await supabase
      .from('team_members')
      .select('id, avatar_url')
      .eq('email', authUser.email)
      .single()

    const googleAvatar = authUser.user_metadata?.avatar_url ||
                         authUser.user_metadata?.picture ||
                         null

    if (existing) {
      // User exists (pre-filled or previously created) - update avatar if missing
      if (!existing.avatar_url && googleAvatar) {
        await supabase
          .from('team_members')
          .update({ avatar_url: googleAvatar })
          .eq('id', existing.id)
      }
    } else {
      // Create new team member
      const name = authUser.user_metadata?.full_name ||
                   authUser.user_metadata?.name ||
                   authUser.email?.split('@')[0] ||
                   'New User'

      await supabase.from('team_members').insert({
        email: authUser.email,
        name: name,
        avatar_url: googleAvatar,
        role: 'Member'
      })
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authUser = session?.user ?? null
      setUser(authUser)
      if (authUser) ensureTeamMember(authUser)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ?? null
      setUser(authUser)
      if (authUser) ensureTeamMember(authUser)
    })

    return () => subscription.unsubscribe()
  }, [])

  const isAuthorized = user && isAllowedEmail(user.email)

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ user, loading }}>
        <Routes>
          <Route path="/login" element={isAuthorized ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="project/:projectId" element={<Project />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthContext.Provider>
    </ThemeProvider>
  )
}

export default App
