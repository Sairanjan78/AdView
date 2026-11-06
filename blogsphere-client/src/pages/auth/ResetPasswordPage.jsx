import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  LuLock, LuEye, LuEyeOff, LuArrowRight, LuCircleAlert, LuLink2Off, LuLoaderCircle,
} from 'react-icons/lu';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import BrandMark from '../../components/layout/BrandMark';
import brand from '../../config/brand';
import Seo from '../../components/seo/Seo';
import { authApi } from '../../services/api';
import { passwordStrength, MIN_PASSWORD_LENGTH } from '../../utils/passwordStrength';
import './AuthPages.css';

const ResetPasswordPage = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  // /reset-password/:token (current emails) or /reset-password?token= (older emails)
  const token = params.token || searchParams.get('token') || '';
  const navigate = useNavigate();
  // checking -> ready | invalid
  const [linkState, setLinkState] = useState('checking');
  const [linkError, setLinkError] = useState('');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;
    if (!token) {
      setLinkState('invalid');
      return undefined;
    }
    authApi.checkResetToken(token)
      .then(() => { if (active) setLinkState('ready'); })
      .catch(err => {
        if (!active) return;
        // Offline: still show the form; the submit will report the real problem
        if (err.isNetworkError) { setLinkState('ready'); return; }
        setLinkError(err.message);
        setLinkState('invalid');
      });
    return () => { active = false; };
  }, [token]);

  const strength = passwordStrength(form.password);
  const mismatch = form.confirm.length > 0 && form.confirm !== form.password;

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrorMsg('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(`Your new password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (form.password !== form.confirm) {
      setErrorMsg('The two passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authApi.resetPassword(token, form.password);
      navigate('/login', {
        replace: true,
        state: { notice: res.message || 'Your password has been updated. Please sign in.' },
      });
    } catch (err) {
      if (err.status === 400 && /expired|invalid/i.test(err.message)) {
        setLinkError(err.message);
        setLinkState('invalid');
      } else {
        setErrorMsg(err.message || 'Could not update your password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Choose a new password" description={`Set a new password for your ${brand.name} account.`} noindex />

      <div className="auth-page">
        <div className="auth-card animate-fadeInUp">
          <div className="auth-card__header">
            <Link to="/" className="auth-logo" aria-label={`${brand.name} home`}>
              <BrandMark />
            </Link>
            {linkState !== 'invalid' && (
              <>
                <h1 className="auth-card__title">Choose a new password</h1>
                <p className="auth-card__sub">Pick something you don't use on other sites. You'll sign in with it next.</p>
              </>
            )}
          </div>

          {linkState === 'checking' && (
            <div className="page-loader auth-checking" role="status">
              <LuLoaderCircle size={24} aria-hidden="true" />
              Checking your link…
            </div>
          )}

          {linkState === 'invalid' && (
            <EmptyState
              icon={LuLink2Off}
              tone="error"
              className="auth-empty"
              title="This link has expired"
              action={<Button to="/forgot-password" variant="primary">Send a new link</Button>}
            >
              {linkError || 'This reset link is invalid or has expired.'} Reset links work once and last 30 minutes.
            </EmptyState>
          )}

          {linkState === 'ready' && (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label htmlFor="reset-password" className="auth-label">New password</label>
                <div className="auth-input-wrap">
                  <LuLock className="auth-input-icon" />
                  <input
                    id="reset-password" name="password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input" placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                    value={form.password} onChange={handleChange}
                    autoComplete="new-password" autoFocus required minLength={MIN_PASSWORD_LENGTH}
                    aria-describedby="reset-strength"
                  />
                  <button
                    type="button" className="auth-input-toggle"
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <LuEyeOff size={14} /> : <LuEye size={14} />}
                  </button>
                </div>
                <div id="reset-strength" className={`auth-strength auth-strength--${strength.score}`} aria-live="polite">
                  <div className="auth-strength__bars" aria-hidden="true">
                    {[1, 2, 3, 4].map(n => <span key={n} className={n <= strength.score ? 'is-on' : ''} />)}
                  </div>
                  <span className="auth-strength__text">
                    {strength.label && <strong>{strength.label}. </strong>}{strength.hint}
                  </span>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="reset-confirm" className="auth-label">Confirm new password</label>
                <div className="auth-input-wrap">
                  <LuLock className="auth-input-icon" />
                  <input
                    id="reset-confirm" name="confirm"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input" placeholder="Type it again"
                    value={form.confirm} onChange={handleChange}
                    autoComplete="new-password" required
                    aria-invalid={mismatch}
                  />
                </div>
                {mismatch && <span className="auth-field-hint auth-field-hint--error">Passwords don't match yet.</span>}
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
                {loading ? 'Saving…' : 'Update password'}
              </Button>
            </form>
          )}

          <p className="auth-card__footer-text">
            <Link to="/login" className="auth-link">Back to sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
