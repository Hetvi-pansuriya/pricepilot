import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/layout.css';

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="navbar-brand">
          <div className="navbar-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="var(--color-primary)" />
              <path d="M7 18L11 10L15 14L21 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 21L11 16L15 18L21 12" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="navbar-title">PricePilot</h1>
            <p className="navbar-subtitle">SAAS PRICING ANALYZER</p>
          </div>
        </div>

        <nav className="navbar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `navbar-link ${isActive ? 'navbar-link-active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 3h6v6H3V3zm0 8h6v6H3v-6zm8-8h6v6h-6V3zm0 8h6v6h-6v-6z" />
            </svg>
            <span>Dashboard</span>
          </NavLink>
        </nav>

        <div className="navbar-footer">
          <button className="navbar-link" onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 3h8v2H5v10h6v2H3V3zm10 4l4 3-4 3v-2H8V9h5V7z" />
            </svg>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Top bar */}
      <header className="app-topbar">
        <nav className="topbar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `topbar-link ${isActive ? 'topbar-link-active' : ''}`}
          >
            Dashboard
          </NavLink>
        </nav>
        <div className="topbar-actions">
          <button className="btn-ghost topbar-icon" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <button className="btn-ghost topbar-icon" aria-label="Help">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
        </div>
      </header>
    </>
  );
}
