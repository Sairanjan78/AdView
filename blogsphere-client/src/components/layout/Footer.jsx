import React from 'react';
import { Link } from 'react-router-dom';
import { LuTwitter, LuInstagram, LuLinkedin, LuMail } from 'react-icons/lu';
import brand from '../../config/brand';
import BrandMark from './BrandMark';
import './Footer.css';

const FOOTER_LINKS = {
  Read: [
    { label: 'Home',         to: '/' },
    { label: 'Explore',      to: '/explore' },
    { label: 'Trending',     to: '/trending' },
    { label: 'Latest',       to: '/latest' },
    { label: 'Categories',   to: '/categories' },
  ],
  Write: [
    { label: 'Start writing',          to: '/register' },
    { label: 'Writer studio',          to: '/write' },
    { label: 'Monetization policy',    to: '/writer-monetization-policy' },
    { label: 'Advertising disclosure', to: '/advertising-disclosure' },
  ],
  Company: [
    { label: 'About',            to: '/about' },
    { label: 'Contact',          to: '/contact' },
    { label: 'Privacy policy',   to: '/privacy-policy' },
    { label: 'Terms of service', to: '/terms' },
    { label: 'Cookie policy',    to: '/cookie-policy' },
  ],
};

// Only profiles configured in brand.social (REACT_APP_SOCIAL_*) are shown
const SOCIAL = [
  { key: 'twitter',   label: 'X (Twitter)', Icon: LuTwitter },
  { key: 'instagram', label: 'Instagram',   Icon: LuInstagram },
  { key: 'linkedin',  label: 'LinkedIn',    Icon: LuLinkedin },
].filter(s => brand.social?.[s.key]);

const Footer = () => (
  <footer className="footer" role="contentinfo">
    <div className="container footer__main">
      <div className="footer__brand-col">
        <Link to="/" className="footer__logo" aria-label={`${brand.name} home`}>
          <BrandMark />
        </Link>
        <p className="footer__brand-desc">{brand.description}</p>
        <div className="footer__social">
          <a href={`mailto:${brand.email}`} className="footer__social-btn" aria-label={`Email ${brand.email}`}>
            <LuMail aria-hidden="true" />
          </a>
          {SOCIAL.map(({ key, label, Icon }) => (
            <a
              key={key}
              href={brand.social[key]}
              target="_blank"
              rel="noopener noreferrer"
              className="footer__social-btn"
              aria-label={label}
            >
              <Icon aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>

      {Object.entries(FOOTER_LINKS).map(([section, links]) => (
        <nav key={section} className="footer__link-col" aria-label={section}>
          <h2 className="footer__col-title">{section}</h2>
          <ul className="footer__col-links">
            {links.map(({ label, to }) => (
              <li key={to}>
                <Link to={to} className="footer__link">{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>

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

export default Footer;
