import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Navbar({ title }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const navigate = useNavigate()

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(query)}`)
      setResults(res.data)
    } catch {
      setResults({ projects: [], files: [] })
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-title">{title}</div>

      <div className="navbar-right" style={{ position: 'relative' }}>
        <form onSubmit={handleSearch}>
          <div className="search-bar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              id="navbar-search-input"
              type="text"
              placeholder="Search projects, files..."
              value={query}
              onChange={e => { setQuery(e.target.value); if (!e.target.value) setResults(null) }}
            />
          </div>
        </form>

        {results && (
          <div style={{
            position: 'absolute', top: '44px', right: 0,
            background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)', minWidth: 320, zIndex: 50,
            boxShadow: 'var(--shadow-lg)', padding: '8px 0',
          }}>
            <div style={{ padding: '8px 16px 4px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Projects ({results.projects.length})
            </div>
            {results.projects.slice(0, 4).map(p => (
              <button key={p.id} id={`search-project-${p.id}`} className="btn btn-ghost w-full" style={{ justifyContent: 'flex-start', borderRadius: 0, padding: '8px 16px' }}
                onClick={() => { navigate('/projects'); setResults(null); setQuery('') }}>
                {p.title}
              </button>
            ))}
            <div style={{ margin: '8px 0 4px', borderTop: '1px solid var(--border)' }} />
            <div style={{ padding: '4px 16px 4px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Files ({results.files.length})
            </div>
            {results.files.slice(0, 4).map(f => (
              <button key={f.id} id={`search-file-${f.id}`} className="btn btn-ghost w-full" style={{ justifyContent: 'flex-start', borderRadius: 0, padding: '8px 16px' }}
                onClick={() => { navigate('/files'); setResults(null); setQuery('') }}>
                {f.original_name}
              </button>
            ))}
            {results.projects.length === 0 && results.files.length === 0 && (
              <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13 }}>No results found</div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
