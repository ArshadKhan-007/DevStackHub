import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar title="Dashboard" />
      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>Welcome back 👋</h2>
            <p>Here's an overview of your developer workspace.</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-center">
            <svg className="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Loading dashboard...
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 28 }}>
              <div className="stat-card" id="stat-projects">
                <div className="stat-icon">🗂</div>
                <div>
                  <div className="stat-value">{data?.total_projects ?? 0}</div>
                  <div className="stat-label">Total Projects</div>
                </div>
              </div>
              <div className="stat-card" id="stat-files">
                <div className="stat-icon">📁</div>
                <div>
                  <div className="stat-value">{data?.total_files ?? 0}</div>
                  <div className="stat-label">Uploaded Files</div>
                </div>
              </div>
              <div className="stat-card" id="stat-storage">
                <div className="stat-icon">💾</div>
                <div>
                  <div className="stat-value">{formatBytes(data?.storage_used_bytes ?? 0)}</div>
                  <div className="stat-label">Storage Used</div>
                </div>
              </div>
              <div className="stat-card" id="stat-activity">
                <div className="stat-icon">⚡</div>
                <div>
                  <div className="stat-value">{data?.recent_activity?.length ?? 0}</div>
                  <div className="stat-label">Recent Events</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <div className="section-title">Recent Activity</div>
              {data?.recent_activity?.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 0' }}>
                  <p>No activity yet. Start by creating a project!</p>
                </div>
              ) : (
                <div className="activity-list">
                  {data?.recent_activity?.map(item => (
                    <div key={item.id} className="activity-item">
                      <div className="activity-dot" />
                      <div>
                        <div className="activity-action">{item.action}</div>
                        <div className="activity-detail">{item.detail}</div>
                      </div>
                      <div className="activity-time">{timeAgo(item.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
