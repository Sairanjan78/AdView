import React from 'react';
import Seo from '../../components/seo/Seo';
import brand from '../../config/brand';
import '../public/AboutPage.css';
import './LegalPage.css';

/**
 * Shared layout for policy pages, reusing the About page's editorial styles.
 * sections: [{ id, title, body: <JSX> }]
 */
const LegalPage = ({ title, intro, description, sections }) => (
  <>
    <Seo title={title} description={description || intro} />

    <div className="about-page legal-page">
      <section className="about-hero">
        <div className="about-hero__glow" aria-hidden="true" />
        <div className="container about-hero__inner">
          <h1 className="about-hero__title">{title}</h1>
          {intro && <p className="about-hero__sub">{intro}</p>}
          <p className="legal-page__updated">Last updated: {brand.legalLastUpdated}</p>
        </div>
      </section>

      <div className="container legal-page__content">
        {sections.map(({ id, title: heading, body }) => (
          <section key={id} id={id} className="about-section">
            <h2 className="about-section__title">{heading}</h2>
            <div className="about-body-text legal-page__body">{body}</div>
          </section>
        ))}
      </div>
    </div>
  </>
);

export default LegalPage;
