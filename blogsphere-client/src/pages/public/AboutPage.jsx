import React from 'react';
import { Link } from 'react-router-dom';
import { LuArrowRight, LuPenLine, LuShield, LuGlobe, LuTrendingUp } from 'react-icons/lu';
import Button from '../../components/ui/Button';
import brand from '../../config/brand';
import Seo from '../../components/seo/Seo';
import './AboutPage.css';

const PILLARS = [
  {
    icon: <LuGlobe size={24} />,
    title: 'Global by Design',
    desc: `Readers and writers from every country, writing in every niche. ${brand.name} is built to grow with every new voice.`,
  },
  {
    icon: <LuShield size={24} />,
    title: 'Quality First',
    desc: 'Every article goes through an editorial approval process. We maintain high standards so readers always find quality content.',
  },
  {
    icon: <LuTrendingUp size={24} />,
    title: 'Writer-Friendly Monetization',
    desc: `Writers earn a share of eligible advertising revenue through our transparent revenue-sharing programme. Percentages are configured by the platform and are not a payment guarantee from any ad provider.`,
  },
];

const AboutPage = () => (
  <>
    <Seo
      title="About"
      description={`Who writes ${brand.name}, how articles are researched, sourced and edited, and how the site is funded.`}
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        url: `${brand.url}/about`,
        mainEntity: {
          '@type': 'Organization',
          name: brand.name,
          url: `${brand.url}/`,
          logo: `${brand.url}/logo512.png`,
          email: brand.email,
          sameAs: Object.values(brand.social).filter(Boolean),
        },
      }}
    />

    <div className="about-page">
      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero__glow" aria-hidden="true" />
        <div className="container about-hero__inner">
          <h1 className="about-hero__title">
            About {brand.name}
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
              We believe great writing should be accessible across languages, cultures, niches, and disciplines.
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
              <div key={p.title} className="about-pillar card animate-fadeInUp">
                <div className="about-pillar__icon" aria-hidden="true">{p.icon}</div>
                <h3 className="about-pillar__title">{p.title}</h3>
                <p className="about-pillar__desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Advertising policy brief */}
        <section className="about-section">
          <div className="about-policy-note">
            <h2 className="about-section__title">Advertising &amp; earnings</h2>
            <p className="about-body-text">
              {brand.name} monetises through Google AdSense and may integrate other eligible advertising providers in the future.
              The platform owner operates the approved publisher account. Advertising revenue is received by the platform and
              distributed to eligible writers according to our revenue-sharing policy, currently a{' '}
              <strong>{brand.revenueShare.writerPool}% writer pool</strong> and{' '}
              <strong>{brand.revenueShare.platformShare}% platform share</strong>. These percentages are
              configurable by the platform administrator.
            </p>
            <p className="about-body-text about-policy-note__fine">
              Writer earnings are estimates until advertising reports are finalised. Invalid traffic deductions
              may apply. No specific earnings are guaranteed. We never incentivise artificial clicks or traffic.
              See our <Link to="/writer-monetization-policy" className="auth-link">Writer Monetization Policy</Link> and{' '}
              <Link to="/advertising-disclosure" className="auth-link">Advertising Disclosure</Link> for full details.
            </p>
          </div>
        </section>

        {/* Founder */}
        <section className="about-section" id="founder">
          <h2 className="about-section__title">Who Runs {brand.name}</h2>
          <p className="about-body-text">
            {brand.name} was started in 2026 by <strong>Sairanjan Biswal</strong>, a software engineer from
            Odisha, India. He completed his Master of Computer Applications at NIIS Institute of Business
            Administration, Bhubaneswar, in 2026 and works as a Software Engineer Intern at Infosys.
          </p>
          <p className="about-body-text">
            He designed and built this platform himself, from the React front end to the Node.js and MongoDB
            back end, and edits what gets published here. His own writing focuses on software tools, careers in
            tech and practical guides for students and early-career developers.
          </p>
          <p className="about-body-text">
            You can reach him at <a href={`mailto:${brand.email}`} className="auth-link">{brand.email}</a>, on{' '}
            <a href="https://www.linkedin.com/in/sairanjan-biswal/" target="_blank" rel="noopener noreferrer" className="auth-link">LinkedIn</a>{' '}
            or on <a href="https://github.com/Sairanjan78" target="_blank" rel="noopener noreferrer" className="auth-link">GitHub</a>.
          </p>
        </section>

        {/* CTA */}
        <section className="about-cta">
          <h2 className="about-cta__title">Ready to join?</h2>
          <div className="about-cta__btns">
            <Button to="/register" variant="primary" size="lg" icon={<LuPenLine />} iconRight={<LuArrowRight />}>Start writing</Button>
            <Button to="/explore" variant="outline" size="lg">Explore articles</Button>
          </div>
        </section>
      </div>
    </div>
  </>
);

export default AboutPage;
