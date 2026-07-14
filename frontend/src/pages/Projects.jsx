import { useEffect, useState, useRef } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'

const EMPTY_FORM = {
  title: '', description: '', technologies: '', github_url: '', live_demo_url: ''
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [thumbUploading, setThumbUploading] = useState(null)
  const thumbRef = useRef()

  const load = () => {
    setLoading(true)
    api.get('/projects').then(res => setProjects(res.data)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setShowModal(true) }
  const openEdit = (p) => {
    setEditing(p)
    setForm({ title: p.title, description: p.description || '', technologies: p.technologies || '',
      github_url: p.github_url || '', live_demo_url: p.live_demo_url || '' })
    setError(''); setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setEditing(null) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editing) {
        await api.put(`/projects/${editing.id}`, form)
      } else {
        await api.post('/projects', form)
      }
      closeModal(); load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return
    await api.delete(`/projects/${id}`)
    load()
  }

  const handleThumbnail = async (projectId, file) => {
    setThumbUploading(projectId)
    const fd = new FormData(); fd.append('file', file)
    try {
      await api.post(`/projects/${projectId}/thumbnail`, fd)
      load()
    } catch { alert('Failed to upload thumbnail') }
    finally { setThumbUploading(null) }
  }

  return (
    <>
      <Navbar title="Projects" />
      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>Projects</h2>
            <p>Showcase your work and manage your portfolio projects.</p>
          </div>
          <button id="create-project-btn" className="btn btn-primary" onClick={openCreate}>
            + New Project
          </button>
        </div>

        {loading ? (
          <div className="loading-center">
            <svg className="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗂</div>
            <h3>No projects yet</h3>
            <p>Click "New Project" to add your first project to the portfolio.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(p => (
              <div key={p.id} className="project-card" id={`project-card-${p.id}`}>
                {/* Thumbnail */}
                <div className="project-thumbnail">
                  {p.thumbnail ? (
                    <img src={p.thumbnail} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>🖼</span>
                  )}
                </div>

                <div className="project-card-body">
                  <div className="project-title">{p.title}</div>
                  <div className="project-desc">{p.description || 'No description'}</div>

                  {p.technologies && (
                    <div className="project-techs">
                      {p.technologies.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                        <span key={t} className="tech-tag">{t}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">GitHub</a>}
                    {p.live_demo_url && <a href={p.live_demo_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">Demo</a>}
                  </div>

                  <div className="project-card-footer">
                    <button id={`edit-project-${p.id}`} className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                      {thumbUploading === p.id ? 'Uploading...' : '🖼 Thumbnail'}
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => handleThumbnail(p.id, e.target.files[0])} />
                    </label>
                    <button id={`delete-project-${p.id}`} className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }}
                      onClick={() => handleDelete(p.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit Project' : 'New Project'}</div>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}>✕</button>
            </div>

            {error && <div className="alert alert-error">⚠ {error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="proj-title">Title *</label>
                <input id="proj-title" className="form-input" placeholder="My Awesome Project"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="proj-desc">Description</label>
                <textarea id="proj-desc" className="form-textarea" placeholder="What does this project do?"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="proj-tech">Technologies</label>
                <input id="proj-tech" className="form-input" placeholder="React, Node.js, PostgreSQL"
                  value={form.technologies} onChange={e => setForm(f => ({ ...f, technologies: e.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="proj-github">GitHub URL</label>
                  <input id="proj-github" className="form-input" placeholder="https://github.com/..."
                    value={form.github_url} onChange={e => setForm(f => ({ ...f, github_url: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="proj-demo">Live Demo URL</label>
                  <input id="proj-demo" className="form-input" placeholder="https://myapp.com"
                    value={form.live_demo_url} onChange={e => setForm(f => ({ ...f, live_demo_url: e.target.value }))} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button id="save-project-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
