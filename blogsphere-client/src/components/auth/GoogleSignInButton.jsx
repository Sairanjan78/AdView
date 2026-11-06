import React, { useEffect, useRef, useState } from 'react';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

export const getGoogleClientId = () => (process.env.REACT_APP_GOOGLE_CLIENT_ID || '').trim();
export const isGoogleSignInEnabled = () => Boolean(getGoogleClientId());

let gsiPromise = null;
const loadGsi = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiPromise) {
    gsiPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => {
        gsiPromise = null;
        reject(new Error('Could not load Google sign-in'));
      };
      document.head.appendChild(script);
    });
  }
  return gsiPromise;
};

/**
 * "Continue with Google" using Google Identity Services.
 * Renders nothing unless REACT_APP_GOOGLE_CLIENT_ID is set.
 * onCredential receives the Google ID token to send to POST /auth/google.
 */
const GoogleSignInButton = ({ onCredential, onError, text = 'continue_with' }) => {
  const containerRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const errorRef = useRef(onError);
  const [failed, setFailed] = useState(false);
  const clientId = getGoogleClientId();

  // Keep the latest handlers without re-rendering Google's button (it reads "remember me" at click time)
  useEffect(() => {
    callbackRef.current = onCredential;
    errorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!clientId) return undefined;
    let cancelled = false;

    loadGsi()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) callbackRef.current?.(response.credential);
            else errorRef.current?.('Google sign-in was cancelled.');
          },
          ux_mode: 'popup',
          cancel_on_tap_outside: true,
        });
        const width = Math.min(Math.max(containerRef.current.offsetWidth || 360, 200), 400);
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          logo_alignment: 'center',
          width,
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, text]);

  if (!clientId) return null;
  if (failed) {
    return <p className="auth-google__failed">Google sign-in could not load. Check your connection or use your email and password.</p>;
  }
  return <div className="auth-google" ref={containerRef} />;
};

export default GoogleSignInButton;
