import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage from './LegalPage';
import brand from '../../config/brand';

const TermsPage = () => (
  <LegalPage
    title="Terms of Service"
    intro={`The rules for reading, writing and publishing on ${brand.name}.`}
    description="The terms for using BlogSphere Mag: accounts, writer content and ownership, acceptable use, ad revenue sharing, intellectual property and liability."
    sections={[
      {
        id: 'acceptance',
        title: 'Acceptance of These Terms',
        body: (
          <p>
            By accessing or using {brand.name} ({brand.url}) you agree to these Terms of Service and our{' '}
            <Link to="/privacy-policy">Privacy Policy</Link>. If you do not agree, please do not use the site.
          </p>
        ),
      },
      {
        id: 'accounts',
        title: 'Accounts',
        body: (
          <ul>
            <li>You must provide accurate information and be at least 13 years old (or the minimum age in your country).</li>
            <li>You are responsible for keeping your password secure and for all activity under your account.</li>
            <li>We may suspend or close accounts that break these terms or put other users at risk.</li>
          </ul>
        ),
      },
      {
        id: 'content',
        title: 'Your Content',
        body: (
          <>
            <p>
              You keep ownership of the articles you publish. By publishing, you grant {brand.name} a worldwide,
              non-exclusive, royalty-free licence to host, display, distribute and promote your content on the
              platform and its channels, and to show advertising alongside it.
            </p>
            <p>You confirm that your content is your own original work (or that you have the rights to publish it) and that it does not:</p>
            <ul>
              <li>Copy or plagiarise others' work or infringe copyright, trademarks or other rights.</li>
              <li>Contain hate speech, harassment, threats, sexually explicit material, or content that promotes violence or illegal activity.</li>
              <li>Spread deliberately false or misleading information, spam, or deceptive links.</li>
              <li>Include personal information about others without their consent.</li>
            </ul>
            <p>We may review, edit for formatting, decline or remove content that violates these terms or advertiser and Google publisher policies.</p>
          </>
        ),
      },
      {
        id: 'acceptable-use',
        title: 'Acceptable Use',
        body: (
          <ul>
            <li>Do not attempt to hack, overload or disrupt the site, or scrape it in bulk without permission.</li>
            <li>Do not click on ads you see on the site, ask others to click them, or use any method to inflate ad impressions or clicks artificially.</li>
            <li>Do not impersonate other people or misrepresent your affiliation.</li>
          </ul>
        ),
      },
      {
        id: 'monetization',
        title: 'Advertising and Writer Earnings',
        body: (
          <p>
            The site is supported by advertising, including Google AdSense. Any writer revenue sharing is governed by
            our <Link to="/writer-monetization-policy">Writer Monetization Policy</Link>; earnings are never guaranteed
            and depend on finalized advertising revenue and policy compliance.
          </p>
        ),
      },
      {
        id: 'ip',
        title: 'Intellectual Property',
        body: (
          <p>
            The {brand.name} name, logo, design and software are owned by us and may not be used without permission.
            If you believe content on the site infringes your copyright, email{' '}
            <a href={`mailto:${brand.email}`}>{brand.email}</a> with the details and we will respond promptly.
          </p>
        ),
      },
      {
        id: 'disclaimers',
        title: 'Disclaimers and Limitation of Liability',
        body: (
          <>
            <p>
              Articles reflect the views of their authors and are provided for general information only. They are
              not professional (medical, legal, financial or other) advice. The site is provided "as is" without
              warranties of any kind.
            </p>
            <p>
              To the fullest extent permitted by law, {brand.name} is not liable for indirect, incidental or
              consequential damages arising from your use of the site or reliance on any content.
            </p>
          </>
        ),
      },
      {
        id: 'third-party',
        title: 'Third-Party Links and Ads',
        body: (
          <p>
            The site contains links and advertisements from third parties. We are not responsible for their
            content, products or privacy practices.
          </p>
        ),
      },
      {
        id: 'changes',
        title: 'Changes and Termination',
        body: (
          <p>
            We may update these terms; the "Last updated" date shows the latest version, and continued use means you
            accept the changes. You may stop using the site and ask us to delete your account at any time.
          </p>
        ),
      },
      {
        id: 'contact',
        title: 'Contact',
        body: (
          <p>
            Questions about these terms? Email <a href={`mailto:${brand.email}`}>{brand.email}</a> or visit our{' '}
            <Link to="/contact">Contact page</Link>.
          </p>
        ),
      },
    ]}
  />
);

export default TermsPage;
