import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import brand from '../../config/brand';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const role = 'writer';
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', agree: false });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrorMsg('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.agree) {
      setErrorMsg('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role
      });
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Become a Writer — {brand.name}</title>
        <meta name="description" content={`Create your writer account on ${brand.name} to write and publish articles.`} />
      </Helmet>

      <div className="auth-page">
        <div className="auth-page__bg" aria-hidden="true" />
        <div className="auth-card glass-card animate-fadeInUp">

          {/* Header */}
          <div className="auth-card__header">
            <Link to="/" className="auth-logo">
              <span>✦</span>
              <span className="gradient-text">{brand.name}</span>
            </Link>
            <h1 className="auth-card__title">Become a Writer</h1>
            <p className="auth-card__sub">Create your writer account to publish stories and reach readers worldwide.</p>
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="auth-field">
              <label htmlFor="reg-name" className="auth-label">Full name</label>
              <div className="auth-input-wrap">
                <FiUser className="auth-input-icon" />
                <input
                  id="reg-name" name="name" type="text"
                  className="auth-input" placeholder="Your full name"
                  value={form.name} onChange={handleChange}
                  autoComplete="name" required
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="reg-email" className="auth-label">Email address</label>
              <div className="auth-input-wrap">
                <FiMail className="auth-input-icon" />
                <input
                  id="reg-email" name="email" type="email"
                  className="auth-input" placeholder="you@example.com"
                  value={form.email} onChange={handleChange}
                  autoComplete="email" required
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="reg-password" className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <FiLock className="auth-input-icon" />
                <input
                  id="reg-password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input" placeholder="At least 8 characters"
                  value={form.password} onChange={handleChange}
                  autoComplete="new-password" required minLength={8}
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
            </div>

            {/* Agree */}
            <label className="auth-checkbox">
              <input
                type="checkbox" name="agree"
                checked={form.agree} onChange={handleChange} required
              />
              <span className="auth-checkbox__label">
                I agree to the{' '}
                <Link to="/terms" className="auth-link">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy-policy" className="auth-link">Privacy Policy</Link>
              </span>
            </label>

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
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          {/* Footer */}
          <p className="auth-card__footer-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>

          {role === 'writer' && (
            <div className="auth-writer-note">
              <strong>Note:</strong> Writer accounts are subject to review. Articles require administrator approval before publication. Advertising earnings are based on eligible content and platform policy — earnings are not guaranteed.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
