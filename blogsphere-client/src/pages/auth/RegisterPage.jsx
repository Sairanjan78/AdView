import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuUser, LuMail, LuLock, LuEye, LuEyeOff, LuArrowRight, LuCircleAlert } from 'react-icons/lu';
import Button from '../../components/ui/Button';
import BrandMark from '../../components/layout/BrandMark';
import brand from '../../config/brand';
import Seo from '../../components/seo/Seo';
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
      <Seo title="Become a Writer" description={`Create your free ${brand.name} account to read, write and publish articles.`} noindex />

      <div className="auth-page">
        <div className="auth-card animate-fadeInUp">

          {/* Header */}
          <div className="auth-card__header">
            <Link to="/" className="auth-logo" aria-label={`${brand.name} home`}>
              <BrandMark />
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
                <LuUser className="auth-input-icon" />
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
                <LuMail className="auth-input-icon" />
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
                <LuLock className="auth-input-icon" />
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
                  {showPassword ? <LuEyeOff size={14} /> : <LuEye size={14} />}
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
              <strong>Note:</strong> Writer accounts are subject to review. Articles require administrator approval before publication. Advertising earnings are based on eligible content and platform policy; earnings are not guaranteed.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
