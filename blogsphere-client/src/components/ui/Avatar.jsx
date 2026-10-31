import React from 'react';
import './Avatar.css';

/**
 * Avatar component
 * @param {string} src    - image URL
 * @param {string} name   - display name (used for initials fallback)
 * @param {string} size   - 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * @param {boolean} verified
 * @param {boolean} ring  - show coloured ring
 */
const Avatar = ({ src, name = '', size = 'md', verified = false, ring = false, className = '' }) => {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`avatar avatar--${size} ${ring ? 'avatar--ring' : ''} ${className}`}>
      {src ? (
        <img src={src} alt={name} className="avatar-img" loading="lazy" />
      ) : (
        <span className="avatar-initials" aria-label={name}>{initials}</span>
      )}
      {verified && (
        <span className="avatar-verified" title="Verified writer" aria-label="Verified">✓</span>
      )}
    </div>
  );
};

export default Avatar;
