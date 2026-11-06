import React, { useState } from 'react';

/**
 * Article cover <img> that disappears if the URL is broken, so the
 * surrounding frame shows its neutral placeholder instead of a broken-image icon.
 */
const CoverImage = ({ src, alt = '', ...props }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return <img src={src} alt={alt} onError={() => setFailed(true)} {...props} />;
};

export default CoverImage;
