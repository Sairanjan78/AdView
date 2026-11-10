import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuSend, LuMail, LuCircleCheck, LuCircleAlert } from 'react-icons/lu';
import Seo from '../../components/seo/Seo';
import Button from '../../components/ui/Button';
import brand from '../../config/brand';
import { contactApi } from '../../services/api';
import '../public/AboutPage.css';
import '../writer/WritePage.css';
import './LegalPage.css';

const EMPTY = { name: '', email: '', subject: '', message: '', website: '' };

const ContactPage = () => {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || form.message.trim().length < 10) {
      setErrorMsg('Please enter your name, email and a message of at least 10 characters.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await contactApi.send(form);
      setSuccessMsg(res?.message || 'Thanks! Your message has been received.');
      setForm(EMPTY);
    } catch (err) {
      setErrorMsg(
        err.isNetworkError
          ? `We couldn't send your message right now. Please email us at ${brand.email}.`
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo
        title="Contact"
        description={`Get in touch with the ${brand.name} team: questions, feedback, partnerships, copyright or privacy requests.`}
      />

      <div className="about-page legal-page">
        <section className="about-hero">
          <div className="about-hero__glow" aria-hidden="true" />
          <div className="container about-hero__inner">
            <h1 className="about-hero__title">Contact us</h1>
            <p className="about-hero__sub">
              Questions, feedback, writing enquiries, copyright or privacy requests: we read every message.
            </p>
            <p className="legal-page__updated">
              <LuMail aria-hidden="true" />
              Prefer email? <a href={`mailto:${brand.email}`}>{brand.email}</a>
            </p>
          </div>
        </section>

        <div className="container legal-page__content">
          <div className="write-card">
            {errorMsg && (
              <div className="write-alert write-alert--error" role="alert">
                <LuCircleAlert aria-hidden="true" />
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="write-alert write-alert--success" role="status">
                <LuCircleCheck aria-hidden="true" />
                {successMsg}
              </div>
            )}

            <form className="write-form" onSubmit={handleSubmit} noValidate>
              <div className="write-row">
                <div className="write-field">
                  <label className="write-label" htmlFor="contact-name">Your Name *</label>
                  <input id="contact-name" name="name" className="write-input" value={form.name}
                    onChange={handleChange} maxLength={80} autoComplete="name" required />
                </div>
                <div className="write-field">
                  <label className="write-label" htmlFor="contact-email">Email Address *</label>
                  <input id="contact-email" name="email" type="email" className="write-input" value={form.email}
                    onChange={handleChange} autoComplete="email" required />
                </div>
              </div>

              <div className="write-field">
                <label className="write-label" htmlFor="contact-subject">Subject</label>
                <input id="contact-subject" name="subject" className="write-input" value={form.subject}
                  onChange={handleChange} maxLength={150} placeholder="General enquiry" />
              </div>

              <div className="write-field">
                <label className="write-label" htmlFor="contact-message">Message *</label>
                <textarea id="contact-message" name="message" className="write-textarea" rows="7"
                  value={form.message} onChange={handleChange} maxLength={5000} required />
              </div>

              {/* Honeypot: hidden from people, catches bots */}
              <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
                <label htmlFor="contact-website">Website</label>
                <input id="contact-website" name="website" tabIndex={-1} autoComplete="off"
                  value={form.website} onChange={handleChange} />
              </div>

              <p className="write-hint">
                We use your details only to reply. See our <Link to="/privacy-policy">Privacy Policy</Link>.
              </p>

              <div className="write-actions">
                <Button type="submit" variant="primary" loading={loading} icon={<LuSend />}>
                  Send Message
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
