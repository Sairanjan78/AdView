import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Seo from '../../components/seo/Seo';
import { useAuth } from '../../context/AuthContext';
import './WritePage.css';

const ProfileSettingsPage = () => {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: '', username: '', bio: '', avatar: '', website: '', linkedin: '', twitter: '', github: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!user) return;
    const links = user.socialLinks || {};
    setForm({
      name: user.name || '', username: user.username || '', bio: user.bio || '', avatar: user.avatar || '',
      website: links.website || '', linkedin: links.linkedin || '', twitter: links.twitter || '', github: links.github || ''
    });
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <p>Please <Link to="/login">sign in</Link> to edit your profile.</p>
      </div>
    );
  }

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(''); setErr('');
    try {
      const { website, linkedin, twitter, github, ...rest } = form;
      await updateProfile({ ...rest, socialLinks: { website, linkedin, twitter, github } });
      setMsg('Profile saved.');
    } catch (error) {
      setErr(error?.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div className="write-field">
      <label htmlFor={`pf-${name}`} className="write-label">{label}</label>
      {props.textarea
        ? <textarea id={`pf-${name}`} name={name} value={form[name]} onChange={onChange} rows={4} maxLength={props.maxLength} className="write-textarea" />
        : <input id={`pf-${name}`} name={name} value={form[name]} onChange={onChange} type={props.type || 'text'} className="write-input" />}
      {props.hint && <small className="write-hint">{props.hint}</small>}
    </div>
  );

  return (
    <div className="write-page">
      <Seo title="Edit profile" noindex />
      <div className="write-container"><div className="write-header"><h1 className="write-title">Edit your profile</h1></div><div className="write-card">
      <form className="write-form" onSubmit={onSubmit}>
        {field('name', 'Display name')}
        {field('username', 'Username', { hint: `Your page: /writer/${form.username || 'username'}` })}
        {field('bio', 'Bio', { textarea: true, maxLength: 500, hint: 'Shown under every article you write.' })}
        {field('avatar', 'Photo URL', { type: 'url', hint: 'Link to a square photo of you.' })}
        {field('website', 'Website', { type: 'url' })}
        {field('linkedin', 'LinkedIn', { type: 'url' })}
        {field('github', 'GitHub', { type: 'url' })}
        {field('twitter', 'X / Twitter', { type: 'url' })}
        {err && <p role="alert" style={{ color: 'crimson' }}>{err}</p>}
        {msg && <p role="status">{msg} <Link to={`/writer/${form.username}`}>View your page</Link></p>}
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</Button>
      </form></div></div>
    </div>
  );
};

export default ProfileSettingsPage;
