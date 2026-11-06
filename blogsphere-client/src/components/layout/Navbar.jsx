import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { LuMenu, LuX, LuPenLine, LuLogIn, LuLogOut } from 'react-icons/lu';
import SearchBar from '../search/SearchBar';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import BrandMark from './BrandMark';
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
            <BrandMark />
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
                <Button to="/write" variant="primary" size="sm" icon={<LuPenLine />} className="navbar__write-btn">Write</Button>
                <Link to={`/writer/${user.username}`} className="navbar__user-badge" title={user.name}>
                  <Avatar src={user.avatar} name={user.name} size="sm" />
                  <span className="navbar__user-name">{user.name.split(' ')[0]}</span>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout} icon={<LuLogOut />} title="Sign out" aria-label="Sign out" />
              </>
            ) : (
              <>
                <Button to="/login" variant="ghost" size="sm" icon={<LuLogIn />} title="Writer / Admin login">Sign in</Button>
                <Button to="/register" variant="primary" size="sm" icon={<LuPenLine />} className="navbar__write-btn">Write</Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="navbar__hamburger"
            onClick={() => setMobileOpen(o => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <LuX size={22} aria-hidden="true" /> : <LuMenu size={22} aria-hidden="true" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        className={`navbar-drawer ${mobileOpen ? 'navbar-drawer--open' : ''}`}
        aria-hidden={!mobileOpen}
        inert={mobileOpen ? undefined : true}
      >
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
                    <div className="navbar-drawer__user-name">{user.name}</div>
                    <div className="navbar-drawer__user-handle">@{user.username}</div>
                  </div>
                </Link>
                <Button to="/write" variant="primary" size="md" icon={<LuPenLine />} fullWidth>Write an article</Button>
                <Button variant="outline" size="md" icon={<LuLogOut />} fullWidth onClick={logout}>Sign out</Button>
              </>
            ) : (
              <>
                <Button to="/register" variant="primary" size="md" icon={<LuPenLine />} fullWidth>Become a writer</Button>
                <Button to="/login" variant="outline" size="md" icon={<LuLogIn />} fullWidth>Writer sign in</Button>
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
