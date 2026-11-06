import React from 'react';
import { LuFeather } from 'react-icons/lu';
import brand from '../../config/brand';

/** Logo: feather mark + wordmark. Shared by the navbar, footer and auth pages. */
const BrandMark = ({ className = '' }) => (
  <span className={`brand-mark ${className}`.trim()}>
    <span className="brand-mark__icon" aria-hidden="true"><LuFeather /></span>
    <span className="brand-mark__name">{brand.name}</span>
  </span>
);

export default BrandMark;
