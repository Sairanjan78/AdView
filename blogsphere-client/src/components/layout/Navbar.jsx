import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiEdit3, FiUser, FiLogOut } from 'react-icons/fi';
import SearchBar from '../search/SearchBar';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import brand from '../../config/brand';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/',           label: 'Home',       exact: true },
  { to: '/explore',    label: 'Explore'     },
  { to: '/trending',   label: 'Trending'    },
  { to: '/categories', label: 'Categories'  },
];

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location]);

  // Add scrolled class after 20px scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} role="banner">
        <div className="container navbar__inner">
          {/* Logo */}
          <Link to="/" className="navbar__logo" aria-label={`${brand.name} home`}>
            <span className="navbar__logo-icon" aria-hidden="true">✦</span>
            <span className="navbar__logo-text gradient-text">{brand.name}</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="navbar__links" aria-label="Main navigation">
            {NAV_LINKS.map(({ to, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop search */}
          <div className="navbar__search">
            <SearchBar variant="navbar" />
          </div>

          {/* Desktop actions */}
          <div className="navbar__actions">
            {isAuthenticated ? (
              <>
                <Link to="/write" className="navbar__write-btn">
                  <Button variant="outline" size="sm" icon={<FiEdit3 />}>Write</Button>
                </Link>
                <Link to={`/writer/${user.username}`} className="navbar__user-badge" title={user.name}>
                  <Avatar src={user.avatar} name={user.name} size="sm" />
                  <span className="navbar__user-name">{user.name.split(' ')[0]}</span>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout} icon={<FiLogOut />} title="Sign out" aria-label="Sign out" />
              </>
            ) : (
              <>
                <Link to="/register" className="navbar__write-btn">
                  <Button variant="outline" size="sm" icon={<FiEdit3 />}>Write</Button>
                </Link>
                <Link to="/login">
                  <Button variant="primary" size="sm" icon={<FiUser />}>Sign in</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="navbar__hamburger"
            onClick={() => setMobileOpen(o => !o)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`navbar-drawer ${mobileOpen ? 'navbar-drawer--open' : ''}`} aria-hidden={!mobileOpen}>
        <div className="navbar-drawer__inner">
          <SearchBar variant="page" />

          <nav className="navbar-drawer__links" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ to, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `navbar-drawer__link ${isActive ? 'navbar-drawer__link--active' : ''}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="navbar-drawer__divider" />

          <div className="navbar-drawer__actions">
            {isAuthenticated ? (
              <>
                <Link to={`/writer/${user.username}`} className="navbar-drawer__user-info">
                  <Avatar src={user.avatar} name={user.name} size="md" />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{user.username}</div>
                  </div>
                </Link>
                <Link to="/write">
                  <Button variant="outline" size="md" icon={<FiEdit3 />} fullWidth>Write an Article</Button>
                </Link>
                <Button variant="ghost" size="md" icon={<FiLogOut />} fullWidth onClick={logout}>Sign out</Button>
              </>
            ) : (
              <>
                <Link to="/register">
                  <Button variant="outline" size="md" icon={<FiEdit3 />} fullWidth>Start writing</Button>
                </Link>
                <Link to="/login">
                  <Button variant="primary" size="md" icon={<FiUser />} fullWidth>Sign in</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="navbar-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
    </>
  );
};

export default Navbar;
