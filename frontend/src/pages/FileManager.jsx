import { useEffect, useState, useRef } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function fileIcon(type, mime) {
  if (type === 'image') return '🖼'
  if (mime?.includes('pdf')) return '📄'
  if (mime?.includes('word')) return '📝'
  if (mime?.includes('presentation') || mime?.includes('powerpoint')) return '📊'
  return '📁'
}

export default function FileManager() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileRef = useRef()

  const load = () => {
    setLoading(true)
    api.get('/files').then(res => setFiles(res.data)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const uploadFile = async (file) => {
    setError(''); setSuccess(''); setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    try {
      await api.post('/files/upload', fd)
      setSuccess(`"${file.name}" uploaded successfully!`)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]; if (file) uploadFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]; if (file) uploadFile(file)
  }

  const handleDownload = async (file) => {
    try {
      const res = await api.get(`/files/download/${file.id}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = file.original_name
      a.click(); window.URL.revokeObjectURL(url)
    } catch { alert('Download failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this file?')) return
    await api.delete(`/files/${id}`)
    load()
  }

  return (
    <>
      <Navbar title="File Manager" />
      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>File Manager</h2>
            <p>Upload, view, download, and delete your documents and images.</p>
          </div>
          <button id="upload-file-btn" className="btn btn-primary" onClick={() => fileRef.current.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : '⬆ Upload File'}
          </button>
          <input ref={fileRef} type="file"
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
            style={{ display: 'none' }} onChange={handleFileInput} />
        </div>

        {error && <div className="alert alert-error">⚠ {error}</div>}
        {success && <div className="alert alert-success">✓ {success}</div>}

        {/* Drop zone */}
        <div
          className={`upload-zone${dragOver ? ' drag-over' : ''}`}
          style={{ marginBottom: 24 }}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current.click()}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
          <p><strong>Drag & drop</strong> files here, or click to select</p>
          <p style={{ marginTop: 6, fontSize: 12 }}>Supported: Images (EFS), PDFs, Word, PowerPoint, Text (S3)</p>
        </div>

        {/* File list */}
        {loading ? (
          <div className="loading-center">
            <svg className="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Loading files...
          </div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
            <h3>No files uploaded yet</h3>
            <p>Upload your first file above.</p>
          </div>
        ) : (
          <div className="file-list">
            {files.map(f => (
              <div key={f.id} className="file-item" id={`file-item-${f.id}`}>
                <div className="file-icon">{fileIcon(f.file_type, f.mime_type)}</div>
                <div className="file-info">
                  <div className="file-name">{f.original_name}</div>
                  <div className="file-meta">
                    <span className={`badge badge-${f.file_type}`}>{f.file_type}</span>
                    &nbsp;· {formatBytes(f.size_bytes)} · {new Date(f.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="file-actions">
                  <button id={`download-file-${f.id}`} className="btn btn-secondary btn-sm" onClick={() => handleDownload(f)}>
                    ⬇ Download
                  </button>
                  <button id={`delete-file-${f.id}`} className="btn btn-danger btn-sm" onClick={() => handleDelete(f.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
