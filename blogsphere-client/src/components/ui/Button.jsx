import React from 'react';
import './Button.css';

/**
 * Button component
 * @param {string}   variant  - 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
 * @param {string}   size     - 'sm' | 'md' | 'lg'
 * @param {boolean}  loading  - show spinner
 * @param {boolean}  fullWidth
 * @param {ReactNode}icon     - optional icon (left side)
 * @param {ReactNode}iconRight - optional icon (right side)
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  iconRight,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${fullWidth ? 'btn--full' : ''} ${loading ? 'btn--loading' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {!loading && icon && <span className="btn-icon btn-icon--left">{icon}</span>}
      <span className="btn-label">{children}</span>
      {!loading && iconRight && <span className="btn-icon btn-icon--right">{iconRight}</span>}
    </button>
  );
};

export default Button;
