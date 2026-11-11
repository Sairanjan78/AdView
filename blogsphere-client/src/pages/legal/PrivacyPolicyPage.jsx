import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage from './LegalPage';
import brand from '../../config/brand';

const ext = (href, label) => (
  <a href={href} target="_blank" rel="noopener noreferrer">{label || href}</a>
);

const PrivacyPolicyPage = () => (
  <LegalPage
    title="Privacy Policy"
    intro={`How ${brand.name} collects, uses and protects your information, including how advertising cookies work on this site.`}
    sections={[
      {
        id: 'overview',
        title: 'Overview',
        body: (
          <p>
            This Privacy Policy explains what information {brand.name} ("we", "us") collects when you visit{' '}
            {brand.url} or use our services, how we use it, and the choices you have. By using the site you agree
            to this policy. If you have questions, contact us at <a href={`mailto:${brand.email}`}>{brand.email}</a>.
          </p>
        ),
      },
      {
        id: 'information-we-collect',
        title: 'Information We Collect',
        body: (
          <>
            <p>We collect only what we need to run the platform:</p>
            <ul>
              <li><strong>Account information</strong>: if you register: your name, email address, username, and a securely hashed password. Writers may add a bio, avatar and social links.</li>
              <li><strong>Content you publish</strong>: articles, drafts, tags and images you submit as a writer.</li>
              <li><strong>Messages</strong>: the name, email address and message you send through our <Link to="/contact">Contact</Link> form.</li>
              <li><strong>Usage data</strong>: standard server logs (IP address, browser type, pages requested, time of request) and anonymous article view counts, used for security and to understand what readers enjoy.</li>
              <li><strong>Cookies and local storage</strong>: described below.</li>
            </ul>
            <p>Reading articles does not require an account.</p>
          </>
        ),
      },
      {
        id: 'how-we-use',
        title: 'How We Use Information',
        body: (
          <ul>
            <li>To provide, maintain and secure the site and your account (including sign-in sessions).</li>
            <li>To publish and display articles and writer profiles.</li>
            <li>To reply to messages and send essential account emails (such as verification or password reset).</li>
            <li>To measure readership and improve content and features.</li>
            <li>To show advertising that keeps the site free to read (see Advertising below).</li>
            <li>To comply with legal obligations and prevent abuse.</li>
          </ul>
        ),
      },
      {
        id: 'cookies',
        title: 'Cookies and Similar Technologies',
        body: (
          <>
            <p>
              Cookies are small text files stored by your browser. We use a strictly necessary cookie and browser
              local storage to keep you signed in. If advertising is enabled, Google and its partners also set
              cookies as described below. You can block or delete cookies in your browser settings; some features
              (like signing in) may not work without them. See our <Link to="/cookie-policy">Cookie Policy</Link> for details.
            </p>
          </>
        ),
      },
      {
        id: 'advertising',
        title: 'Advertising and Google AdSense',
        body: (
          <>
            <p>
              We use Google AdSense to display advertisements. Third-party vendors, including Google, use cookies to
              serve ads based on your prior visits to this website or other websites. Google's use of advertising
              cookies enables it and its partners to serve ads to you based on your visits to this site and/or other
              sites on the Internet.
            </p>
            <p>
              Third-party vendors and ad networks may also use cookies, web beacons and similar technologies to
              measure ad performance and to personalise ads. We do not control these third-party cookies, and this
              policy does not cover their practices. Learn more in{' '}
              {ext('https://policies.google.com/technologies/partner-sites', "How Google uses information from sites or apps that use its services")}{' '}
              and Google's {ext('https://policies.google.com/technologies/ads', 'advertising policies')}.
            </p>
            <p><strong>How to opt out of personalised advertising:</strong></p>
            <ul>
              <li>Visit Google {ext('https://adssettings.google.com', 'Ads Settings')} (also at {ext('https://www.google.com/settings/ads', 'www.google.com/settings/ads')}) to turn off personalised ads from Google.</li>
              <li>Opt out of many third-party vendors' cookies for personalised advertising at {ext('https://www.aboutads.info/choices/', 'www.aboutads.info')}.</li>
              <li>In the European Economic Area and UK, use {ext('https://www.youronlinechoices.eu/', 'www.youronlinechoices.eu')}.</li>
              <li>Block or delete cookies in your browser settings.</li>
            </ul>
            <p>
              If you opt out you will still see ads, but they will be less relevant to you. Where required by law
              (for example in the EEA, UK and Switzerland) we ask for your consent before personalised ads are
              shown, using a consent message provided through Google.
            </p>
          </>
        ),
      },
      {
        id: 'sharing',
        title: 'How Information Is Shared',
        body: (
          <>
            <p>We do not sell your personal information. We share information only:</p>
            <ul>
              <li>With service providers who host our site and database or deliver email, under confidentiality obligations.</li>
              <li>With advertising partners such as Google, through the cookies described above.</li>
              <li>Publicly, when you choose to publish it (articles, writer name, bio and avatar).</li>
              <li>When required by law, or to protect the rights and safety of our users and the platform.</li>
            </ul>
          </>
        ),
      },
      {
        id: 'retention-security',
        title: 'Data Retention and Security',
        body: (
          <p>
            We keep account data while your account is active and delete it within a reasonable time after you ask
            us to close your account, unless we must keep it for legal reasons. Contact messages are kept only as long
            as needed to respond. Passwords are stored as one-way hashes, and connections to the site are encrypted.
            No method of transmission or storage is 100% secure, but we take reasonable measures to protect your data.
          </p>
        ),
      },
      {
        id: 'your-rights',
        title: 'Your Rights and Choices',
        body: (
          <p>
            Depending on where you live (for example under the GDPR, UK GDPR, California law or India's Digital
            Personal Data Protection Act), you may have the right to access, correct, delete or export your personal
            data, and to object to or restrict certain processing or withdraw consent. You can edit your profile at any
            time, and you can make any request by emailing <a href={`mailto:${brand.email}`}>{brand.email}</a>. We will
            respond within the time required by applicable law.
          </p>
        ),
      },
      {
        id: 'children',
        title: "Children's Privacy",
        body: (
          <p>
            {brand.name} is not directed to children under 13 (or the minimum age required in your country), and we do
            not knowingly collect their personal information. If you believe a child has given us personal data,
            please contact us and we will delete it.
          </p>
        ),
      },
      {
        id: 'changes',
        title: 'Changes to This Policy',
        body: (
          <p>
            We may update this policy from time to time. The "Last updated" date at the top shows when it last
            changed. Significant changes will be highlighted on the site.
          </p>
        ),
      },
      {
        id: 'contact',
        title: 'Contact Us',
        body: (
          <p>
            Questions about privacy? Email <a href={`mailto:${brand.email}`}>{brand.email}</a> or use our{' '}
            <Link to="/contact">Contact page</Link>.
          </p>
        ),
      },
    ]}
  />
);

export default PrivacyPolicyPage;
