import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { getAdsenseClient, loadAdSenseScript } from '../../config/ads';

/**
 * Site-wide AdSense setup: the account meta tag (used by AdSense site verification) and the
 * adsbygoogle.js script (also enables Auto ads if you switch them on in AdSense).
 * Renders nothing when REACT_APP_ADSENSE_CLIENT is not set.
 */
const AdSenseHead = () => {
  useEffect(() => { loadAdSenseScript(); }, []);
  const client = getAdsenseClient();
  if (!client) return null;
  return (
    <Helmet>
      <meta name="google-adsense-account" content={client} />
    </Helmet>
  );
};

export default AdSenseHead;
