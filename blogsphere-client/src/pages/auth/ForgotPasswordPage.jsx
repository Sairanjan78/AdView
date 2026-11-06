import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LuMail, LuArrowRight, LuArrowLeft, LuCircleAlert, LuMailCheck } from 'react-icons/lu';
import Button from '../../components/ui/Button';
import BrandMark from '../../components/layout/BrandMark';
import brand from '../../config/brand';
import Seo from '../../components/seo/Seo';
import { authApi } from '../../services/api';
import './AuthPages.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordPage = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sentTo, setSentTo] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await authApi.forgotPassword(value);
      setSentTo(value);
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Reset your password" description={`Get a link to reset your ${brand.name} password.`} noindex />

      <div className="auth-page">
        <div className="auth-card animate-fadeInUp">
          <div className="auth-card__header">
            <Link to="/" className="auth-logo" aria-label={`${brand.name} home`}>
              <BrandMark />
            </Link>
            {sentTo ? (
              <>
                <span className="auth-status-icon" aria-hidden="true"><LuMailCheck size={22} /></span>
                <h1 className="auth-card__title">Check your inbox</h1>
                <p className="auth-card__sub">
                  If an account exists for <strong>{sentTo}</strong>, we've sent a link to reset your password.
                  It works once and expires in 30 minutes. Don't forget to check your spam folder.
                </p>
              </>
            ) : (
              <>
                <h1 className="auth-card__title">Forgot your password?</h1>
                <p className="auth-card__sub">Enter the email you sign in with and we'll send you a link to choose a new one.</p>
              </>
            )}
          </div>

          {sentTo ? (
            <div className="auth-form">
              <Button to="/login" state={{ email: sentTo }} variant="primary" size="lg" fullWidth icon={<LuArrowLeft />}>
                Back to sign in
              </Button>
              <p className="auth-card__note">
                Didn't get an email?{' '}
                <button type="button" className="auth-link auth-link--button" onClick={() => setSentTo('')}>
                  Try again
                </button>
              </p>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label htmlFor="forgot-email" className="auth-label">Email address</label>
                <div className="auth-input-wrap">
                  <LuMail className="auth-input-icon" />
                  <input
                    id="forgot-email" name="email" type="email"
                    className="auth-input" placeholder="you@example.com"
                    value={email} onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                    autoComplete="email" autoFocus required
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="auth-error-banner" role="alert">
                  <LuCircleAlert size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                iconRight={!loading && <LuArrowRight />}
              >
                {loading ? 'Sending link…' : 'Send reset link'}
              </Button>
            </form>
          )}

          <p className="auth-card__footer-text">
            Remembered it?{' '}
            <Link to="/login" className="auth-link">Back to sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
