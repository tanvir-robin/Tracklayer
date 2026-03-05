import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function navClass(path) {
    return 'nav-link' + (location.pathname.startsWith(path) ? ' active' : '');
  }

  function handleNavClick() {
    setMenuOpen(false);
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <Link to="/dashboard" className="brand-link">
            <img src="/logo.png" alt="TrackLayer" className="brand-logo" />
            <span className="brand-name">TrackLayer</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="sidebar-nav">
          <Link to="/dashboard" className={navClass('/dashboard')}>Dashboard</Link>
          <Link to="/assets" className={navClass('/assets')}>Assets</Link>
          <Link to="/contact" className={navClass('/contact')}>Contact</Link>
        </nav>

        {/* Desktop footer */}
        <div className="sidebar-footer">
          <span className="sidebar-user">{user?.email}</span>
          <button className="btn btn-sm btn-ghost" onClick={handleLogout}>Logout</button>
        </div>

        {/* Mobile top-bar extras */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </aside>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/dashboard" className={navClass('/dashboard')} onClick={handleNavClick}>Dashboard</Link>
          <Link to="/assets" className={navClass('/assets')} onClick={handleNavClick}>Assets</Link>
          <Link to="/contact" className={navClass('/contact')} onClick={handleNavClick}>Contact</Link>
          <div className="mobile-menu-footer">
            <span className="sidebar-user">{user?.email}</span>
            <button className="btn btn-sm btn-ghost" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      )}

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
