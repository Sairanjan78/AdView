/**
 * Google AdSense configuration (all optional).
 * Ads render ONLY when REACT_APP_ADSENSE_CLIENT is a valid "ca-pub-XXXXXXXXXXXXXXXX" id;
 * otherwise every <AdSlot> renders nothing and no Google script is loaded.
 * Each slot also needs its ad-unit id (AdSense > Ads > By ad unit > Display ads > "data-ad-slot").
 * Values are read from the environment at build time (Create React App inlines REACT_APP_*).
 */
const PUBLISHER_ID = /^ca-pub-\d{10,20}$/;
let warned = false;

/** The configured publisher id ("ca-pub-..."), or '' when ads are off. */
export function getAdsenseClient() {
  const raw = (process.env.REACT_APP_ADSENSE_CLIENT || '').trim();
  if (PUBLISHER_ID.test(raw)) return raw;
  if (raw && !warned && process.env.NODE_ENV !== 'production') {
    warned = true;
    // eslint-disable-next-line no-console
    console.warn(`[AdSense] REACT_APP_ADSENSE_CLIENT "${raw}" is not a valid ca-pub-... id; ads are disabled.`);
  }
  return '';
}

export const isAdsEnabled = () => Boolean(getAdsenseClient());

export const AD_SLOTS = {
  articleTop: (process.env.REACT_APP_ADSENSE_SLOT_ARTICLE_TOP || '').trim(),
  articleEnd: (process.env.REACT_APP_ADSENSE_SLOT_ARTICLE_END || '').trim(),
  home: (process.env.REACT_APP_ADSENSE_SLOT_HOME || '').trim(),
};

const SCRIPT_SRC = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';

/** Adds adsbygoogle.js to <head> once per page load (no-op when ads are disabled). */
export function loadAdSenseScript() {
  const client = getAdsenseClient();
  if (!client || typeof document === 'undefined') return;
  if (document.querySelector(`script[src^="${SCRIPT_SRC}"]`)) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = `${SCRIPT_SRC}?client=${client}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}
