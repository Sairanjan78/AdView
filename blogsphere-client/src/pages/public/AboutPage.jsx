import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiEdit3, FiShield, FiGlobe, FiTrendingUp } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import brand from '../../config/brand';
import './AboutPage.css';

const PILLARS = [
  {
    icon: <FiGlobe size={24} />,
    title: 'Global by Design',
    desc: 'Readers and writers from every country, writing in every niche. BlogSphere is built to scale to millions of voices.',
  },
  {
    icon: <FiShield size={24} />,
    title: 'Quality First',
    desc: 'Every article goes through an editorial approval process. We maintain high standards so readers always find quality content.',
  },
  {
    icon: <FiTrendingUp size={24} />,
    title: 'Writer-Friendly Monetization',
    desc: `Writers earn a share of eligible advertising revenue through our transparent revenue-sharing programme. Percentages are configured by the platform and are not a payment guarantee from any ad provider.`,
  },
];

const AboutPage = () => (
  <>
    <Helmet>
      <title>About — {brand.name}</title>
      <meta name="description" content={`Learn about ${brand.name} — ${brand.description}`} />
    </Helmet>

    <div className="about-page">
      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero__glow" aria-hidden="true" />
        <div className="container about-hero__inner">
          <h1 className="about-hero__title">
            About <span className="gradient-text">{brand.name}</span>
          </h1>
          <p className="about-hero__sub">{brand.description}</p>
        </div>
      </section>

      <div className="container">
        {/* Mission */}
        <section className="about-section">
          <h2 className="about-section__title">Our Mission</h2>
          <div className="about-mission-grid">
            <p className="about-body-text">
              {brand.name} exists to give every idea a platform and every reader the stories they're looking for.
              We believe great writing should be accessible — across languages, cultures, niches, and disciplines.
            </p>
            <p className="about-body-text">
              We're building the infrastructure that makes it easy for talented writers to reach global audiences,
              and for curious readers to discover perspectives they've never encountered before.
            </p>
          </div>
        </section>

        {/* Pillars */}
        <section className="about-section">
          <h2 className="about-section__title">What We Stand For</h2>
          <div className="about-pillars stagger-children">
            {PILLARS.map(p => (
              <div key={p.title} className="about-pillar glass-card animate-fadeInUp">
                <div className="about-pillar__icon">{p.icon}</div>
                <h3 className="about-pillar__title">{p.title}</h3>
                <p className="about-pillar__desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Advertising policy brief */}
        <section className="about-section">
          <div className="about-policy-note glass-card">
            <h2 className="about-section__title" style={{ marginBottom: 0 }}>Advertising & Earnings</h2>
            <p className="about-body-text">
              {brand.name} monetises through Google AdSense and may integrate other eligible advertising providers in the future.
              The platform owner operates the approved publisher account. Advertising revenue is received by the platform and
              distributed to eligible writers according to our revenue-sharing policy — currently a{' '}
              <strong>{brand.revenueShare.writerPool}% writer pool</strong> and{' '}
              <strong>{brand.revenueShare.platformShare}% platform share</strong>. These percentages are
              configurable by the platform administrator.
            </p>
            <p className="about-body-text" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Writer earnings are estimates until advertising reports are finalised. Invalid traffic deductions
              may apply. No specific earnings are guaranteed. We never incentivise artificial clicks or traffic.
              See our <Link to="/writer-monetization-policy" className="auth-link">Writer Monetization Policy</Link> and{' '}
              <Link to="/advertising-disclosure" className="auth-link">Advertising Disclosure</Link> for full details.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="about-cta">
          <h2 className="about-cta__title">Ready to join?</h2>
          <div className="about-cta__btns">
            <Link to="/register"><Button variant="primary" size="lg" icon={<FiEdit3 />} iconRight={<FiArrowRight />}>Start writing</Button></Link>
            <Link to="/explore"><Button variant="outline" size="lg">Explore articles</Button></Link>
          </div>
        </section>
      </div>
    </div>
  </>
);

export default AboutPage;
