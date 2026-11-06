import React, { useState } from 'react';
import { LuBadgeCheck } from 'react-icons/lu';
import './Avatar.css';

/**
 * Avatar component
 * @param {string} src    - image URL (falls back to initials if missing or broken)
 * @param {string} name   - display name (used for initials and alt text)
 * @param {string} size   - 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 * @param {boolean} verified
 * @param {boolean} ring  - show accent ring
 */
const Avatar = ({ src, name = '', size = 'md', verified = false, ring = false, className = '' }) => {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <span className={`avatar avatar--${size} ${ring ? 'avatar--ring' : ''} ${className}`.trim()}>
      <span className="avatar__media">
        {src && !failed ? (
          <img src={src} alt={name} className="avatar-img" loading="lazy" onError={() => setFailed(true)} />
        ) : (
          <span className="avatar-initials" role="img" aria-label={name}>{initials}</span>
        )}
      </span>
      {verified && (
        <span className="avatar-verified" title="Verified writer">
          <LuBadgeCheck aria-hidden="true" />
          <span className="sr-only">Verified writer</span>
        </span>
      )}
    </span>
  );
};

export default Avatar;
