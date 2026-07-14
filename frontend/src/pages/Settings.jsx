import { useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '', bio: user?.bio || '',
    skills: user?.skills || '', experience: user?.experience || '',
  })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' })
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  const handleProfileSave = async (e) => {
    e.preventDefault(); setSavingProfile(true); setProfileMsg({ type: '', text: '' })
    try {
      await api.put('/profile', profileForm)
      await refreshUser()
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.detail || 'Update failed' })
    } finally { setSavingProfile(false) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'Passwords do not match' }); return
    }
    if (pwForm.new_password.length < 6) {
      setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' }); return
    }
    setSavingPw(true); setPwMsg({ type: '', text: '' })
    try {
      await api.post('/settings/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      })
      setPwMsg({ type: 'success', text: 'Password changed successfully!' })
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to change password' })
    } finally { setSavingPw(false) }
  }

  return (
    <>
      <Navbar title="Settings" />
      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>Settings</h2>
            <p>Manage your account preferences and security.</p>
          </div>
        </div>

        {/* Profile section */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-title">Update Profile</div>

          {profileMsg.text && (
            <div className={`alert alert-${profileMsg.type}`}>
              {profileMsg.type === 'error' ? '⚠' : '✓'} {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleProfileSave}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="settings-name">Full Name</label>
                <input id="settings-name" className="form-input" value={profileForm.name}
                  onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={user?.email} disabled style={{ opacity: 0.5 }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="settings-bio">Bio</label>
              <textarea id="settings-bio" className="form-textarea"
                value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="settings-skills">Skills</label>
              <input id="settings-skills" className="form-input" placeholder="Comma-separated"
                value={profileForm.skills} onChange={e => setProfileForm(f => ({ ...f, skills: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button id="settings-profile-save-btn" type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Password section */}
        <div className="card">
          <div className="section-title">Change Password</div>

          {pwMsg.text && (
            <div className={`alert alert-${pwMsg.type}`}>
              {pwMsg.type === 'error' ? '⚠' : '✓'} {pwMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label" htmlFor="current-password">Current Password</label>
              <input id="current-password" type="password" className="form-input"
                value={pwForm.current_password}
                onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="new-password">New Password</label>
                <input id="new-password" type="password" className="form-input" placeholder="Min 6 chars"
                  value={pwForm.new_password}
                  onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">Confirm New</label>
                <input id="confirm-password" type="password" className="form-input" placeholder="Repeat"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button id="settings-change-password-btn" type="submit" className="btn btn-primary" disabled={savingPw}>
                {savingPw ? 'Changing...' : '🔑 Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
