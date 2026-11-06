import React from 'react';
import {
  LuCpu, LuFlaskConical, LuBriefcase, LuTrendingUp, LuHeartPulse, LuPalette, LuPlane,
  LuChefHat, LuWallet, LuGraduationCap, LuLeaf, LuTrophy, LuClapperboard, LuFileText,
} from 'react-icons/lu';

/**
 * Category icons (Lucide, via react-icons/lu).
 * Categories store a kebab-case icon key (e.g. 'cpu', 'flask-conical'); anything unknown,
 * including an emoji left in an older database, falls back to a neutral document icon.
 */
export const categoryIcons = {
  cpu: LuCpu,
  'flask-conical': LuFlaskConical,
  briefcase: LuBriefcase,
  'trending-up': LuTrendingUp,
  'heart-pulse': LuHeartPulse,
  palette: LuPalette,
  plane: LuPlane,
  'chef-hat': LuChefHat,
  wallet: LuWallet,
  'graduation-cap': LuGraduationCap,
  leaf: LuLeaf,
  trophy: LuTrophy,
  clapperboard: LuClapperboard,
  'file-text': LuFileText,
};

// Emoji used by earlier versions of the seed, so un-migrated databases still get the right icon
const LEGACY_EMOJI = {
  '💻': 'cpu', '🔬': 'flask-conical', '📈': 'briefcase', '🏃': 'heart-pulse', '🎨': 'palette',
  '✈️': 'plane', '✈': 'plane', '🍳': 'chef-hat', '💰': 'wallet', '📚': 'graduation-cap',
  '🌿': 'leaf', '⚽': 'trophy', '🎬': 'clapperboard', '📄': 'file-text',
};

export const FALLBACK_ICON = LuFileText;

/** Resolve an icon key (or legacy emoji) to a Lucide component. */
export function getCategoryIcon(key) {
  if (!key) return FALLBACK_ICON;
  const k = String(key).trim();
  return categoryIcons[k] || categoryIcons[k.toLowerCase()] || categoryIcons[LEGACY_EMOJI[k]] || FALLBACK_ICON;
}

/** Renders a category's icon. Decorative by default (the category name is shown next to it). */
const CategoryIcon = ({ icon, size = 16, className = '', ...props }) => {
  const Icon = getCategoryIcon(icon);
  return <Icon size={size} className={`category-icon ${className}`.trim()} aria-hidden="true" focusable="false" {...props} />;
};

export default CategoryIcon;
