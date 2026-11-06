import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage from './LegalPage';
import brand from '../../config/brand';

const CookiePolicyPage = () => (
  <LegalPage
    title="Cookie Policy"
    intro={`Which cookies ${brand.name} uses and how to control them.`}
    sections={[
      {
        id: 'necessary',
        title: 'Strictly Necessary',
        body: (
          <ul>
            <li><strong>token</strong> (cookie) and <strong>token</strong> (browser local or session storage) – keep you signed in. Set only when you sign in; removed when you sign out or after it expires. With "Remember me" ticked it lasts 30 days; otherwise it is kept only until you close your browser (at most 1 day).</li>
            <li>If you choose <strong>Continue with Google</strong>, Google's sign-in service (accounts.google.com) may set its own cookies to run the sign-in, as described in Google's privacy policy.</li>
          </ul>
        ),
      },
      {
        id: 'advertising',
        title: 'Advertising Cookies (Google AdSense)',
        body: (
          <>
            <p>
              When ads are shown, Google and its partners may set cookies (for example <em>__gads</em>, <em>__gpi</em>,
              <em> IDE</em>, <em>NID</em>) to serve ads, limit how often you see them, measure their performance and,
              with your consent where required, personalise them based on your visits to this and other sites.
            </p>
            <p>
              You can turn off personalised ads at{' '}
              <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>{' '}
              or opt out of third-party vendors at{' '}
              <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.
              More details are in our <Link to="/privacy-policy#advertising">Privacy Policy</Link>.
            </p>
          </>
        ),
      },
      {
        id: 'control',
        title: 'Managing Cookies',
        body: (
          <p>
            Most browsers let you view, block and delete cookies in their settings. Blocking strictly necessary
            cookies will prevent signing in, but you can still read every article.
          </p>
        ),
      },
    ]}
  />
);

export default CookiePolicyPage;
