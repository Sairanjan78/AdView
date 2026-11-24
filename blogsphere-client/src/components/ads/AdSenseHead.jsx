import React, { useEffect } from 'react';
import { getAdsenseClient, loadAdSenseScript } from '../../config/ads';

/**
 * Loads the AdSense delivery script when a valid publisher ID is configured.
 * The verification meta tag is inserted into build/index.html by postbuild-seo.js,
 * so it is present in the original HTML response before React runs.
 */
const AdSenseHead = () => {
  useEffect(() => { loadAdSenseScript(); }, []);
  // Keep this component mounted site-wide; no runtime Helmet tag is needed.
  return null;
};

export default AdSenseHead;
