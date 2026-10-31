import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import './SearchBar.css';

/**
 * SearchBar — can be used inline (hero) or in the navbar.
 * @param {string}   variant  - 'hero' | 'navbar' | 'page'
 * @param {string}   placeholder
 * @param {function} onSearch - optional controlled callback
 */
const SearchBar = ({ variant = 'navbar', placeholder = 'Search articles, topics, writers…', onSearch }) => {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (onSearch) {
      onSearch(q);
    } else {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  // Keyboard shortcut: Ctrl/Cmd+K focuses search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <form
      className={`search-bar search-bar--${variant} ${focused ? 'search-bar--focused' : ''}`}
      onSubmit={handleSubmit}
      role="search"
    >
      <button type="submit" className="search-bar__icon-btn" aria-label="Search">
        <FiSearch className="search-bar__icon" />
      </button>
      <input
        ref={inputRef}
        type="search"
        className="search-bar__input"
        placeholder={placeholder}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="Search"
        autoComplete="off"
        spellCheck={false}
      />
      {query && (
        <button type="button" className="search-bar__clear" onClick={handleClear} aria-label="Clear search">
          <FiX size={14} />
        </button>
      )}
      {variant !== 'hero' && (
        <kbd className="search-bar__shortcut" aria-label="Keyboard shortcut: Control K">⌘K</kbd>
      )}
      {variant === 'hero' && (
        <button type="submit" className="search-bar__submit-btn" aria-label="Search">
          Search
        </button>
      )}
    </form>
  );
};

export default SearchBar;
