import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuSend, LuFileText, LuCircleCheck, LuCircleAlert, LuLock, LuPenLine } from 'react-icons/lu';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import brand from '../../config/brand';
import Seo from '../../components/seo/Seo';
import { useAuth } from '../../context/AuthContext';
import { articleApi } from '../../services/api';
import useCategories from '../../hooks/useCategories';
import './WritePage.css';

const WritePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { categories: CATEGORIES } = useCategories();

  const [formData, setFormData] = useState({
    title: '',
    category: 'technology',
    excerpt: '',
    coverImage: '',
    tags: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleSubmit = async (status = 'published') => {
    if (!formData.title.trim()) {
      setErrorMsg('Please enter an article title');
      return;
    }
    if (!formData.content.trim()) {
      setErrorMsg('Please write your article content');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        excerpt: formData.excerpt,
        coverImage: formData.coverImage || undefined,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        content: formData.content,
        status
      };

      const res = await articleApi.createArticle(payload);
      setSuccessMsg(
        status === 'published'
          ? 'Article published successfully!'
          : 'Draft saved successfully!'
      );

      if (res?.data?.article?.slug) {
        setTimeout(() => {
          navigate(`/article/${res.data.article.slug}`);
        }, 1200);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save article. Please ensure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container">
        <Seo title="Writer Studio" description={`Write and publish your stories on ${brand.name}.`} noindex />
        <EmptyState
          icon={LuLock}
          title="Sign in to write"
          action={
            <div className="write-gate__actions">
              <Button variant="primary" onClick={() => navigate('/login')}>Sign in as writer</Button>
              <Button variant="outline" onClick={() => navigate('/register')}>Apply as writer</Button>
            </div>
          }
        >
          Anyone can read every story. To write or publish an article, sign in to your writer account.
        </EmptyState>
      </div>
    );
  }

  return (
    <>
      <Seo title="Writer Studio" description={`Write and publish your stories on ${brand.name}.`} noindex />

      <div className="write-page">
        <div className="container write-container">
          <div className="write-header">
            <p className="page-eyebrow"><LuPenLine size={14} aria-hidden="true" /> Writer studio</p>
            <h1 className="write-title">Write a story</h1>
            <p className="write-sub">Share your thoughts with readers across the world.</p>
          </div>

          <div className="write-card">
            {errorMsg && (
              <div className="write-alert write-alert--error">
                <LuCircleAlert aria-hidden="true" />
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="write-alert write-alert--success">
                <LuCircleCheck aria-hidden="true" />
                {successMsg}
              </div>
            )}

            <form className="write-form" onSubmit={(e) => e.preventDefault()}>
              <div className="write-field">
                <label className="write-label" htmlFor="title">Title <span aria-hidden="true">*</span></label>
                <input
                  id="title"
                  name="title"
                  className="write-input"
                  placeholder="Give your story a clear, compelling title…"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="write-row">
                <div className="write-field">
                  <label className="write-label" htmlFor="category">Category *</label>
                  <select
                    id="category"
                    name="category"
                    className="write-select"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="write-field">
                  <label className="write-label" htmlFor="tags">Tags (comma separated)</label>
                  <input
                    id="tags"
                    name="tags"
                    className="write-input"
                    placeholder="e.g. artificial-intelligence, future, technology"
                    value={formData.tags}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="write-field">
                <label className="write-label" htmlFor="coverImage">Cover Image URL (optional)</label>
                <input
                  id="coverImage"
                  name="coverImage"
                  className="write-input"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.coverImage}
                  onChange={handleChange}
                />
              </div>

              <div className="write-field">
                <label className="write-label" htmlFor="excerpt">Short Excerpt (optional)</label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  className="write-textarea"
                  rows="2"
                  placeholder="A one- or two-sentence summary to appear on article preview cards..."
                  value={formData.excerpt}
                  onChange={handleChange}
                />
              </div>

              <div className="write-field">
                <label className="write-label" htmlFor="content">Story Content *</label>
                <textarea
                  id="content"
                  name="content"
                  className="write-textarea write-textarea--content"
                  placeholder="Tell your story. Format with paragraphs, quotes, and thoughts..."
                  value={formData.content}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="write-actions">
                <Button
                  type="button"
                  variant="outline"
                  loading={loading}
                  icon={<LuFileText />}
                  onClick={() => handleSubmit('draft')}
                >
                  Save Draft
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  loading={loading}
                  icon={<LuSend />}
                  onClick={() => handleSubmit('published')}
                >
                  Publish Now
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default WritePage;

