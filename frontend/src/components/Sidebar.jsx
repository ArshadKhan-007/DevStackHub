import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { to: '/projects',  label: 'Projects',  icon: '◈' },
  { to: '/files',     label: 'File Manager', icon: '⊡' },
  { to: '/profile',   label: 'Profile',   icon: '◉' },
  { to: '/activity',  label: 'Activity',  icon: '◎' },
  { to: '/settings',  label: 'Settings',  icon: '◌' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>DevStack Hub</h1>
        <span>Developer Dashboard</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span style={{ fontSize: 16 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          {user?.profile_picture ? (
            <img src={user.profile_picture} alt="avatar" />
          ) : (
            <div className="sidebar-user-avatar">{initials}</div>
          )}
          <div className="sidebar-user-info">
            <div className="sidebar-user-name truncate">{user?.name}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
        <button
          id="sidebar-logout-btn"
          className="btn btn-ghost w-full mt-8"
          style={{ justifyContent: 'flex-start', paddingLeft: 12, gap: 10 }}
          onClick={handleLogout}
        >
          <span>⎋</span> Logout
        </button>
      </div>
    </aside>
  )
}
