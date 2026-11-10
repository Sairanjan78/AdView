import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { LuMenu, LuX, LuPenLine, LuLogIn, LuLogOut } from 'react-icons/lu';
import SearchBar from '../search/SearchBar';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import BrandMark from './BrandMark';
import LanguageSwitcher from './LanguageSwitcher';
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
  const hamburgerRef = useRef(null);
  const drawerRef = useRef(null);
  const wasOpen = useRef(false);

  const closeMenu = useCallback(() => setMobileOpen(false), []);

  // Close mobile menu on route change (pathname or query, e.g. a search from the drawer)
  useEffect(() => setMobileOpen(false), [location.pathname, location.search]);

  // While the drawer is open: lock page scroll, make the page behind it inert,
  // close on Esc, and close if the window grows past the mobile breakpoint.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const root = document.documentElement;
    const behind = document.querySelectorAll('.page-content, .footer');
    root.classList.add('is-scroll-locked');
    behind.forEach(el => { el.inert = true; });

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setMobileOpen(false);
      }
    };
    const desktop = window.matchMedia ? window.matchMedia('(min-width: 861px)') : null;
    const onDesktop = (e) => { if (e.matches) setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    desktop?.addEventListener?.('change', onDesktop);

    return () => {
      root.classList.remove('is-scroll-locked');
      behind.forEach(el => { el.inert = false; });
      document.removeEventListener('keydown', onKey);
      desktop?.removeEventListener?.('change', onDesktop);
    };
  }, [mobileOpen]);

  // Focus: first link in the drawer on open, back to the menu button on close
  useEffect(() => {
    if (mobileOpen) {
      wasOpen.current = true;
      const first = drawerRef.current?.querySelector('a[href], button:not([disabled]), input');
      // Don't pop the keyboard open on phones by focusing the search field
      const target = first?.tagName === 'INPUT'
        ? drawerRef.current.querySelector('.navbar-drawer__link')
        : first;
      target?.focus({ preventScroll: true });
    } else if (wasOpen.current) {
      wasOpen.current = false;
      if (drawerRef.current?.contains(document.activeElement) || document.activeElement === document.body) {
        hamburgerRef.current?.focus({ preventScroll: true });
      }
    }
  }, [mobileOpen]);

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
          <Link to="/" className="navbar__logo" aria-label={`${brand.name} home`} onClick={closeMenu}>
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
            <LanguageSwitcher className="navbar__lang" />
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
            ref={hamburgerRef}
            type="button"
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
        ref={drawerRef}
        className={`navbar-drawer ${mobileOpen ? 'navbar-drawer--open' : ''}`}
        role="dialog"
        aria-modal={mobileOpen ? 'true' : undefined}
        aria-label="Menu"
        aria-hidden={!mobileOpen}
        inert={mobileOpen ? undefined : true}
      >
        {/* Any link tap closes the drawer, including one to the page already open */}
        <div className="navbar-drawer__inner" onClick={e => { if (e.target.closest('a')) closeMenu(); }}>
          <SearchBar variant="page" />
          <LanguageSwitcher className="navbar-drawer__lang" />

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
                <Button variant="outline" size="md" icon={<LuLogOut />} fullWidth onClick={() => { closeMenu(); logout(); }}>Sign out</Button>
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
        <div className="navbar-overlay" onClick={closeMenu} aria-hidden="true" />
      )}
    </>
  );
};

export default Navbar;
