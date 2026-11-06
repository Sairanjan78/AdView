import React from 'react';
import { LuInbox } from 'react-icons/lu';
import './EmptyState.css';

/**
 * Friendly placeholder for empty lists, missing pages and load errors.
 * @param {ElementType} icon   - a Lucide icon component (react-icons/lu)
 * @param {string}      title
 * @param {ReactNode}   children - supporting text
 * @param {ReactNode}   action   - optional button/link
 * @param {string}      tone     - 'default' | 'error'
 */
const EmptyState = ({ icon: Icon = LuInbox, title, children, action, tone = 'default', className = '' }) => (
  <div className={`empty-state empty-state--${tone} ${className}`.trim()} role={tone === 'error' ? 'alert' : undefined}>
    <span className="empty-state__icon" aria-hidden="true"><Icon size={26} /></span>
    {title && <h2 className="empty-state__title">{title}</h2>}
    {children && <p className="empty-state__text">{children}</p>}
    {action && <div className="empty-state__action">{action}</div>}
  </div>
);

export default EmptyState;
