import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTwitter, FiInstagram, FiLinkedin, FiArrowRight, FiMail } from 'react-icons/fi';
import brand from '../../config/brand';
import './Footer.css';

const FOOTER_LINKS = {
  Platform: [
    { label: 'Home',         to: '/' },
    { label: 'Explore',      to: '/explore' },
    { label: 'Trending',     to: '/trending' },
    { label: 'Categories',   to: '/categories' },
    { label: 'Latest',       to: '/latest' },
  ],
  Writers: [
    { label: 'Start Writing',          to: '/register' },
    { label: 'Writer Dashboard',       to: '/dashboard' },
    { label: 'Monetization Policy',    to: '/writer-monetization-policy' },
    { label: 'Advertising Disclosure', to: '/advertising-disclosure' },
  ],
  Company: [
    { label: 'About',     to: '/about' },
    { label: 'Contact',   to: '/contact' },
    { label: 'Privacy',   to: '/privacy-policy' },
    { label: 'Terms',     to: '/terms' },
    { label: 'Cookies',   to: '/cookie-policy' },
  ],
};

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Phase 2+: wire to API
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="footer" role="contentinfo">
      {/* Newsletter band */}
      <div className="footer__newsletter-band">
        <div className="container footer__newsletter-inner">
          <div className="footer__newsletter-copy">
            <h3 className="footer__newsletter-title">
              Get the best stories delivered weekly
            </h3>
            <p className="footer__newsletter-sub">
              Join 120,000+ readers. No spam, unsubscribe anytime.
            </p>
          </div>
          {subscribed ? (
            <div className="footer__newsletter-thanks">
              <span>🎉</span> Thanks! Check your inbox to confirm.
            </div>
          ) : (
            <form className="footer__newsletter-form" onSubmit={handleSubscribe}>
              <div className="footer__newsletter-field">
                <FiMail className="footer__newsletter-icon" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  aria-label="Email address for newsletter"
                  className="footer__newsletter-input"
                />
              </div>
              <button type="submit" className="footer__newsletter-btn">
                Subscribe <FiArrowRight size={14} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main footer */}
      <div className="container footer__main">
        {/* Brand column */}
        <div className="footer__brand-col">
          <Link to="/" className="footer__logo">
            <span className="footer__logo-icon" aria-hidden="true">✦</span>
            <span className="footer__logo-text gradient-text">{brand.name}</span>
          </Link>
          <p className="footer__brand-desc">{brand.description}</p>
          <div className="footer__social">
            <a href={brand.social.twitter} target="_blank" rel="noopener noreferrer" className="footer__social-btn" aria-label="Twitter">
              <FiTwitter />
            </a>
            <a href={brand.social.instagram} target="_blank" rel="noopener noreferrer" className="footer__social-btn" aria-label="Instagram">
              <FiInstagram />
            </a>
            <a href={brand.social.linkedin} target="_blank" rel="noopener noreferrer" className="footer__social-btn" aria-label="LinkedIn">
              <FiLinkedin />
            </a>
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([section, links]) => (
          <div key={section} className="footer__link-col">
            <h4 className="footer__col-title">{section}</h4>
            <ul className="footer__col-links">
              {links.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="footer__link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p className="footer__copyright">
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <p className="footer__disclaimer">
            Advertising earnings displayed are estimates only. Actual payouts depend on finalized provider reports and platform policy. {brand.name} operates the publisher account; revenue sharing is a platform policy, not a Google or Meta guarantee.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
