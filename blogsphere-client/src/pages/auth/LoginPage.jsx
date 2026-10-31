import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import brand from '../../config/brand';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrorMsg('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Writer & Admin Sign In — {brand.name}</title>
        <meta name="description" content={`Sign in to your ${brand.name} creator or admin account.`} />
      </Helmet>

      <div className="auth-page">
        <div className="auth-page__bg" aria-hidden="true" />
        <div className="auth-card glass-card animate-fadeInUp">

          <div className="auth-card__header">
            <Link to="/" className="auth-logo">
              <span>✦</span>
              <span className="gradient-text">{brand.name}</span>
            </Link>
            <h1 className="auth-card__title">Welcome back</h1>
            <p className="auth-card__sub">Sign in to your writer or administrator portal.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="login-email" className="auth-label">Email address</label>
              <div className="auth-input-wrap">
                <FiMail className="auth-input-icon" />
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
                <Link to="/forgot-password" className="auth-link auth-link--sm">Forgot password?</Link>
              </div>
              <div className="auth-input-wrap">
                <FiLock className="auth-input-icon" />
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
                  {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="auth-error-banner" role="alert">
                <FiAlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              iconRight={!loading && <FiArrowRight />}
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
