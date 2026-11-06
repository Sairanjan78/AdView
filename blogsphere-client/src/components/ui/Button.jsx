import React from 'react';
import { Link } from 'react-router-dom';
import './Button.css';

/**
 * Button component
 * @param {string}   variant  - 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger'
 * @param {string}   size     - 'sm' | 'md' | 'lg'
 * @param {string}   to       - render as a router link instead of a <button>
 * @param {string}   href     - render as a plain anchor
 * @param {boolean}  loading  - show spinner
 * @param {boolean}  fullWidth
 * @param {ReactNode}icon     - optional icon (left side)
 * @param {ReactNode}iconRight - optional icon (right side)
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  loading = false,
  fullWidth = false,
  icon,
  iconRight,
  className = '',
  disabled,
  ...props
}) => {
  const classes = `btn btn--${variant} btn--${size} ${fullWidth ? 'btn--full' : ''} ${loading ? 'btn--loading' : ''} ${className}`
    .replace(/\s+/g, ' ')
    .trim();

  const inner = (
    <>
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {!loading && icon && <span className="btn-icon btn-icon--left" aria-hidden="true">{icon}</span>}
      <span className="btn-label">{children}</span>
      {!loading && iconRight && <span className="btn-icon btn-icon--right" aria-hidden="true">{iconRight}</span>}
    </>
  );

  if (to) return <Link to={to} className={classes} {...props}>{inner}</Link>;
  if (href) return <a href={href} className={classes} {...props}>{inner}</a>;

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {inner}
    </button>
  );
};

export default Button;
