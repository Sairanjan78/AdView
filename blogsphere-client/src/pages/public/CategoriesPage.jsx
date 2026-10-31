import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import brand from '../../config/brand';
import { CATEGORIES } from '../../data/mockData';
import './CategoriesPage.css';

const CategoriesPage = () => (
  <>
    <Helmet>
      <title>Categories — {brand.name}</title>
      <meta name="description" content={`Browse all content categories on ${brand.name}.`} />
    </Helmet>

    <div className="categories-page">
      <div className="container">
        <h1 className="categories-page__title">
          Browse by <span className="gradient-text">Category</span>
        </h1>
        <p className="categories-page__sub">Find articles that match your interests</p>

        <div className="categories-grid stagger-children">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="category-card glass-card hover-lift animate-fadeInUp"
              style={{ '--cat-color': cat.color }}
            >
              <div className="category-card__icon-wrap">
                <span className="category-card__icon" aria-hidden="true">{cat.icon}</span>
              </div>
              <div className="category-card__body">
                <h2 className="category-card__name">{cat.name}</h2>
                <span className="category-card__count">{cat.count.toLocaleString()} articles</span>
              </div>
              <FiArrowRight className="category-card__arrow" size={18} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  </>
);

export default CategoriesPage;
