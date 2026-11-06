import React from 'react';
import { Link } from 'react-router-dom';
import { LuArrowRight, LuLayoutGrid } from 'react-icons/lu';
import brand from '../../config/brand';
import Seo from '../../components/seo/Seo';
import CategoryIcon from '../../components/ui/CategoryIcon';
import useCategories from '../../hooks/useCategories';
import './CategoriesPage.css';

const CategoriesPage = () => {
  const { categories } = useCategories();

  return (
    <>
      <Seo title="Categories" description={`Browse all content categories on ${brand.name}.`} />

      <div className="container categories-page">
        <header className="page-header">
          <p className="page-eyebrow"><LuLayoutGrid size={14} aria-hidden="true" /> Categories</p>
          <h1 className="page-title">Browse by topic</h1>
          <p className="page-lede">Pick a subject and dive into everything we have written about it.</p>
        </header>

        <ul className="categories-grid stagger-children">
          {categories.map(cat => (
            <li key={cat.id} className="animate-fadeInUp">
              <Link to={`/categories/${cat.slug}`} className="category-card glass-card" style={{ '--cat-color': cat.color }}>
                <span className="category-card__icon-wrap">
                  <CategoryIcon icon={cat.icon} size={22} />
                </span>
                <span className="category-card__body">
                  <span className="category-card__name">{cat.name}</span>
                  <span className="category-card__count">
                    {cat.count > 0 ? `${cat.count.toLocaleString()} article${cat.count !== 1 ? 's' : ''}` : 'No articles yet'}
                  </span>
                </span>
                <LuArrowRight className="category-card__arrow" size={18} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default CategoriesPage;
