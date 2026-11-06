import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage from './LegalPage';
import brand from '../../config/brand';

const MonetizationPolicyPage = () => (
  <LegalPage
    title="Writer Monetization Policy"
    intro="How eligible advertising revenue may be shared with writers."
    sections={[
      {
        id: 'how',
        title: 'How It Works',
        body: (
          <>
            <p>
              {brand.name} operates the advertising (publisher) account for the whole site. Under our platform
              policy, up to {brand.revenueShare.writerPool}% of eligible, finalized advertising revenue may be
              distributed to writers whose original articles generate it; the remainder covers hosting, moderation
              and development.
            </p>
            <p>
              Revenue sharing is a {brand.name} policy. It is not a payment, partnership or guarantee from Google or
              any other ad provider, and writers must not join or contact ad networks on the platform's behalf.
            </p>
          </>
        ),
      },
      {
        id: 'eligibility',
        title: 'Eligibility',
        body: (
          <ul>
            <li>Articles must be original, published under your own account, and follow our <Link to="/terms">Terms</Link>.</li>
            <li>Only revenue confirmed in the ad provider's finalized reports counts; invalid or suspicious traffic is excluded.</li>
            <li>Clicking your own ads, asking others to click, or buying traffic leads to removal from the programme.</li>
          </ul>
        ),
      },
      {
        id: 'no-guarantee',
        title: 'No Guaranteed Earnings',
        body: (
          <p>
            Advertising income varies with traffic, audience location, season and advertiser demand. Any earnings
            shown are estimates until finalized, and percentages may change with notice. Questions:{' '}
            <a href={`mailto:${brand.email}`}>{brand.email}</a>.
          </p>
        ),
      },
    ]}
  />
);

export default MonetizationPolicyPage;
