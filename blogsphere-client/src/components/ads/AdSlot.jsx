import React, { useEffect, useRef } from 'react';
import { getAdsenseClient, loadAdSenseScript } from '../../config/ads';
import './AdSlot.css';

/**
 * Google AdSense display unit.
 * Renders nothing unless REACT_APP_ADSENSE_CLIENT is set AND a slot id is given,
 * so the layout is unchanged when ads are off.
 *
 * Usage: <AdSlot slot={AD_SLOTS.articleTop} />
 */
const AdSlot = ({ slot, format = 'auto', layout, className = '', style }) => {
  const insRef = useRef(null);
  const client = getAdsenseClient();
  const enabled = Boolean(client && slot);

  useEffect(() => {
    if (!enabled) return;
    loadAdSenseScript();
    const ins = insRef.current;
    // Each <ins> may only be filled once (guards React StrictMode double effects)
    if (!ins || ins.getAttribute('data-adsbygoogle-status') || ins.dataset.pushed) return;
    ins.dataset.pushed = 'true';
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      // Ad blockers or an unapproved site make this throw; never break the page
    }
  }, [enabled, slot]);

  if (!enabled) return null;

  return (
    <aside className={`ad-slot ${className}`} aria-label="Advertisement">
      <span className="ad-slot__label">Advertisement</span>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        {...(layout ? { 'data-ad-layout': layout } : {})}
      />
    </aside>
  );
};

export default AdSlot;
