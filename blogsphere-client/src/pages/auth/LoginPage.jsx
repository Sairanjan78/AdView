import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LuMail, LuLock, LuEye, LuEyeOff, LuArrowRight, LuCircleAlert, LuCircleCheck } from 'react-icons/lu';
import Button from '../../components/ui/Button';
import GoogleSignInButton, { isGoogleSignInEnabled } from '../../components/auth/GoogleSignInButton';
import BrandMark from '../../components/layout/BrandMark';
import brand from '../../config/brand';
import Seo from '../../components/seo/Seo';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: location.state?.email || '', password: '', remember: false });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // e.g. "Your password has been updated" after a reset
  const notice = location.state?.notice;

  // Google's button calls back later, so read "remember me" from a ref at that moment
  const rememberRef = useRef(form.remember);
  useEffect(() => { rememberRef.current = form.remember; }, [form.remember]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrorMsg('');
  };

  const handleGoogleCredential = useCallback(async credential => {
    setGoogleLoading(true);
    setErrorMsg('');
    try {
      await loginWithGoogle(credential, rememberRef.current);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }, [loginWithGoogle, navigate]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      await login(form.email.trim(), form.password, form.remember);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Writer & Admin Sign In" description={`Sign in to your ${brand.name} creator or admin account.`} noindex />

      <div className="auth-page">
        <div className="auth-card animate-fadeInUp">

          <div className="auth-card__header">
            <Link to="/" className="auth-logo" aria-label={`${brand.name} home`}>
              <BrandMark />
            </Link>
            <h1 className="auth-card__title">Welcome back</h1>
            <p className="auth-card__sub">Sign in to your writer or administrator portal.</p>
          </div>

          {notice && (
            <div className="auth-success-banner" role="status">
              <LuCircleCheck size={16} />
              <span>{notice}</span>
            </div>
          )}

          {isGoogleSignInEnabled() && (
            <>
              <div className={`auth-google-wrap ${googleLoading ? 'auth-google-wrap--busy' : ''}`} aria-busy={googleLoading}>
                <GoogleSignInButton onCredential={handleGoogleCredential} onError={setErrorMsg} />
              </div>
              <div className="auth-divider" role="separator"><span>or sign in with email</span></div>
            </>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="login-email" className="auth-label">Email address</label>
              <div className="auth-input-wrap">
                <LuMail className="auth-input-icon" />
                <input
                  id="login-email" name="email" type="email"
                  className="auth-input" placeholder="you@example.com"
                  value={form.email} onChange={handleChange}
                  autoComplete="email" required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="login-password" className="auth-label">Password</label>
                <Link to="/forgot-password" state={{ email: form.email }} className="auth-link auth-link--sm">Forgot password?</Link>
              </div>
              <div className="auth-input-wrap">
                <LuLock className="auth-input-icon" />
                <input
                  id="login-password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input" placeholder="Your password"
                  value={form.password} onChange={handleChange}
                  autoComplete="current-password" required
                />
                <button
                  type="button" className="auth-input-toggle"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <LuEyeOff size={14} /> : <LuEye size={14} />}
                </button>
              </div>
            </div>

            <label className="auth-checkbox">
              <input
                type="checkbox" name="remember"
                checked={form.remember} onChange={handleChange}
              />
              <span className="auth-checkbox__label">
                Remember me <span className="auth-checkbox__hint">(stay signed in on this device for 30 days)</span>
              </span>
            </label>

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
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="auth-card__footer-text">
            Want to write on {brand.name}?{' '}
            <Link to="/register" className="auth-link">Apply as Writer</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
