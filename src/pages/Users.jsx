import { useState, useEffect, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

const TEAM_OPTIONS = ['Dev', 'Content', 'SEO', 'Project Manager', 'Account Management', 'Design']
const ROLE_OPTIONS = ['Admin', 'Member']

const TEAM_COLORS = {
  'Dev': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Content': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'SEO': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'Project Manager': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Account Management': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Design': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const ROLE_COLORS = {
  'Admin': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Member': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

export default function Users() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formTeam, setFormTeam] = useState('')
  const [formRole, setFormRole] = useState('Member')
  const [formAvatar, setFormAvatar] = useState(null)
  const [formAvatarPreview, setFormAvatarPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false)

  // Cropping state
  const [showCropper, setShowCropper] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching team members:', error)
    } else {
      setMembers(data || [])
      // Check if current user is admin
      const currentMember = data?.find(m => m.email === user?.email)
      setCurrentUserIsAdmin(currentMember?.role === 'Admin')
    }
    setLoading(false)
  }

  function openAddModal() {
    setEditingMember(null)
    setFormName('')
    setFormEmail('')
    setFormTeam('')
    setFormRole('Member')
    setFormAvatar(null)
    setFormAvatarPreview(null)
    setShowModal(true)
  }

  function openEditModal(member) {
    setEditingMember(member)
    setFormName(member.name)
    setFormEmail(member.email)
    setFormTeam(member.team || '')
    setFormRole(member.role || 'Member')
    setFormAvatar(null)
    setFormAvatarPreview(member.avatar_url || null)
    setShowModal(true)
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCropImageSrc(reader.result)
        setShowCropper(true)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
      }
      reader.readAsDataURL(file)
    }
  }

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  async function getCroppedImage(imageSrc, pixelCrop) {
    const image = new Image()
    image.src = imageSrc
    await new Promise((resolve) => { image.onload = resolve })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // Set canvas size to the cropped area
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/jpeg', 0.9)
    })
  }

  async function handleCropConfirm() {
    if (!croppedAreaPixels || !cropImageSrc) return

    const croppedBlob = await getCroppedImage(cropImageSrc, croppedAreaPixels)
    const croppedFile = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' })

    setFormAvatar(croppedFile)
    setFormAvatarPreview(URL.createObjectURL(croppedBlob))
    setShowCropper(false)
    setCropImageSrc(null)
  }

  function handleCropCancel() {
    setShowCropper(false)
    setCropImageSrc(null)
  }

  async function uploadAvatar(file, memberId) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${memberId}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      console.error('Avatar upload error:', uploadError)
      return null
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    return data.publicUrl
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)

    let avatarUrl = editingMember?.avatar_url || null

    // Upload avatar if a new one was selected
    if (formAvatar) {
      const memberId = editingMember?.id || crypto.randomUUID()
      const uploadedUrl = await uploadAvatar(formAvatar, memberId)
      if (uploadedUrl) {
        avatarUrl = uploadedUrl
      }
    }

    // Build update object
    const updateData = {
      name: formName,
      email: formEmail,
      team: formTeam || null,
      role: formRole,
      avatar_url: avatarUrl,
    }

    if (editingMember) {
      const { error } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('id', editingMember.id)

      if (error) {
        console.error('Error updating member:', error)
        // If some columns don't exist, try with basic fields + avatar
        if (error.message?.includes('column')) {
          const { error: retryError } = await supabase
            .from('team_members')
            .update({ name: formName, email: formEmail, team: formTeam || null, avatar_url: avatarUrl })
            .eq('id', editingMember.id)

          if (retryError) {
            alert('Failed to update member: ' + retryError.message)
            setSaving(false)
            return
          }
        } else {
          alert('Failed to update member: ' + error.message)
          setSaving(false)
          return
        }
      }
    } else {
      const { error } = await supabase
        .from('team_members')
        .insert(updateData)

      if (error) {
        console.error('Error adding member:', error)
        // If some columns don't exist, try with basic fields + avatar
        if (error.message?.includes('column')) {
          const { error: retryError } = await supabase
            .from('team_members')
            .insert({ name: formName, email: formEmail, team: formTeam || null, avatar_url: avatarUrl })

          if (retryError) {
            alert(retryError.message.includes('duplicate') ? 'This email already exists' : 'Failed to add member')
            setSaving(false)
            return
          }
        } else {
          alert(error.message.includes('duplicate') ? 'This email already exists' : 'Failed to add member')
          setSaving(false)
          return
        }
      }
    }

    setShowModal(false)
    fetchMembers()
    setSaving(false)
  }

  function formatLastActive(date) {
    if (!date) return 'Never'
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  async function removeMember(memberId) {
    if (!confirm('Are you sure you want to remove this user?')) return

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)

    if (error) {
      console.error('Error removing member:', error)
      alert('Failed to remove member')
    } else {
      fetchMembers()
    }
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Users</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage team members who can be assigned feedback
          </p>
        </div>
        {currentUserIsAdmin && (
          <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        )}
      </div>

      {/* Users Table */}
      {members.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">No users yet</p>
          {currentUserIsAdmin && (
            <button onClick={openAddModal} className="btn-primary">
              Add your first user
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">User</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Last Active</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Team</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Role</th>
                  <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, index) => (
                  <tr key={member.id} className={`hover:bg-primary/10 transition-colors border-b border-border-light dark:border-border-dark ${
                    index % 2 === 1 ? 'bg-slate-50 dark:bg-white/5' : ''
                  }`}>
                    {/* Profile & Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center text-white font-semibold shrink-0">
                            {member.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">{member.name}</span>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-6 py-4">
                      <span className="text-gray-600 dark:text-gray-400">{member.email}</span>
                    </td>
                    {/* Last Active */}
                    <td className="px-6 py-4">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {formatLastActive(member.last_active || member.created_at)}
                      </span>
                    </td>
                    {/* Team */}
                    <td className="px-6 py-4">
                      {member.team ? (
                        <span className={`inline-block text-xs px-2.5 py-1 rounded-lg font-medium ${TEAM_COLORS[member.team]}`}>
                          {member.team}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">—</span>
                      )}
                    </td>
                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-lg font-medium ${ROLE_COLORS[member.role] || ROLE_COLORS['Member']}`}>
                        {member.role || 'Member'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      {currentUserIsAdmin ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeMember(member.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingMember ? 'Edit User' : 'Add User'}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {formAvatarPreview ? (
                      <img
                        src={formAvatarPreview}
                        alt="Avatar preview"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center text-white font-semibold text-xl">
                        {formName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <label
                      htmlFor="avatarUpload"
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-light transition-colors"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </label>
                    <input
                      type="file"
                      id="avatarUpload"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p className="font-medium text-gray-700 dark:text-gray-300">Profile Photo</p>
                    <p>Click the camera icon to upload</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    id="userName"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="input w-full"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    id="userEmail"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="input w-full"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="userTeam" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Team
                    </label>
                    <select
                      id="userTeam"
                      value={formTeam}
                      onChange={(e) => setFormTeam(e.target.value)}
                      className="input w-full"
                    >
                      <option value="">No team</option>
                      {TEAM_OPTIONS.map((team) => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="userRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Role
                    </label>
                    <select
                      id="userRole"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="input w-full"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingMember ? 'Save Changes' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {showCropper && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Crop Image</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Drag to reposition, scroll to zoom</p>
            </div>

            <div className="relative h-80 bg-gray-100 dark:bg-gray-800">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 mb-4">
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCropCancel}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropConfirm}
                  className="btn-primary"
                >
                  Apply Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
