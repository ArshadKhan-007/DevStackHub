import { useState, useRef } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    skills: user?.skills || '',
    experience: user?.experience || '',
  })
  const [saving, setSaving] = useState(false)
  const [uploadingPic, setUploadingPic] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const picRef = useRef()

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.put('/profile', form)
      await refreshUser()
      setSuccess('Profile updated successfully!')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePicUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingPic(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      await api.post('/profile/picture', fd)
      await refreshUser()
      setSuccess('Profile picture updated!')
    } catch {
      setError('Failed to upload picture')
    } finally {
      setUploadingPic(false)
    }
  }

  return (
    <>
      <Navbar title="Profile" />
      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>Your Profile</h2>
            <p>Manage your public developer profile and personal information.</p>
          </div>
        </div>

        {error && <div className="alert alert-error">⚠ {error}</div>}
        {success && <div className="alert alert-success">✓ {success}</div>}

        {/* Profile header */}
        <div className="profile-header" style={{ marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt="Profile" className="profile-avatar" />
            ) : (
              <div className="profile-avatar-placeholder">{initials}</div>
            )}
          </div>
          <div className="profile-info">
            <h2>{user?.name}</h2>
            <p>{user?.email}</p>
            <p style={{ marginTop: 4, fontSize: 12 }}>Member since {new Date(user?.created_at).toLocaleDateString()}</p>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                id="profile-upload-pic-btn"
                className="btn btn-secondary btn-sm"
                onClick={() => picRef.current.click()}
                disabled={uploadingPic}
              >
                {uploadingPic ? 'Uploading...' : '📷 Change Photo'}
              </button>
              <input ref={picRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePicUpload} />
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="card">
          <div className="section-title">Edit Information</div>
          <form onSubmit={handleSave}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="profile-name">Full Name</label>
                <input id="profile-name" className="form-input" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="profile-email">Email</label>
                <input id="profile-email" className="form-input" value={user?.email} disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-bio">Bio</label>
              <textarea id="profile-bio" className="form-textarea" placeholder="Tell others about yourself..."
                value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-skills">Skills</label>
              <input id="profile-skills" className="form-input" placeholder="e.g. React, Python, Docker, AWS"
                value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
              <span className="input-hint">Comma-separated list of skills</span>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-experience">Experience</label>
              <textarea id="profile-experience" className="form-textarea" placeholder="Describe your professional experience..."
                value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} />
            </div>

            {/* Skills pills preview */}
            {form.skills && (
              <div className="project-techs" style={{ marginBottom: 16 }}>
                {form.skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                  <span key={s} className="tech-tag">{s}</span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button id="profile-save-btn" type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
