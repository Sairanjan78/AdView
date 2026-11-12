import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage from './LegalPage';
import brand from '../../config/brand';

const AdvertisingDisclosurePage = () => (
  <LegalPage
    title="Advertising Disclosure"
    intro={`How advertising supports ${brand.name}.`}
    description="How BlogSphere Mag is funded: Google AdSense ads, clearly labelled and kept separate from articles, and how we disclose sponsored or affiliate content."
    sections={[
      {
        id: 'ads',
        title: 'Ads on This Site',
        body: (
          <>
            <p>
              {brand.name} is free to read because it shows advertising, served by Google AdSense. Ads are clearly
              labelled "Advertisement" and are kept separate from article content.
            </p>
            <p>
              Advertisers do not choose, review or pay for our articles, and writers do not control which ads appear.
              Seeing an ad next to an article is not an endorsement by the writer or by {brand.name}.
            </p>
          </>
        ),
      },
      {
        id: 'sponsored',
        title: 'Sponsored Content and Affiliate Links',
        body: (
          <p>
            If an article is ever sponsored or contains affiliate links, it will say so clearly at the top of the
            article.
          </p>
        ),
      },
      {
        id: 'privacy',
        title: 'Your Privacy',
        body: (
          <p>
            Advertising partners may use cookies. See our <Link to="/privacy-policy#advertising">Privacy Policy</Link>{' '}
            for how this works and how to opt out of personalised ads.
          </p>
        ),
      },
    ]}
  />
);

export default AdvertisingDisclosurePage;
