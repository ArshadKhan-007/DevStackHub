import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const ACTION_ICON = {
  'Login': '🔐',
  'Logout': '🚪',
  'User Registered': '🎉',
  'Profile Updated': '✏️',
  'Password Changed': '🔑',
  'Project Created': '🗂',
  'Project Updated': '✏️',
  'Project Deleted': '🗑',
  'File Uploaded': '📁',
  'File Deleted': '🗑',
}

export default function Activity() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/activity?limit=50')
      .then(res => setLogs(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar title="Activity Log" />
      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>Activity Log</h2>
            <p>A full history of actions taken in your account.</p>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading-center">
              <svg className="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Loading activity...
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <h3>No activity yet</h3>
              <p>Events will appear here as you use DevStack Hub.</p>
            </div>
          ) : (
            <div className="activity-list">
              {logs.map(log => (
                <div key={log.id} className="activity-item" id={`activity-${log.id}`}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>
                    {ACTION_ICON[log.action] || '⚡'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="activity-action">{log.action}</div>
                    <div className="activity-detail">{log.detail}</div>
                  </div>
                  <div className="activity-time">{timeAgo(log.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
