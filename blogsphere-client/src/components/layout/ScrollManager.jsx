import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/** 'instant' when the reader asked for reduced motion, otherwise 'smooth'. */
export const scrollBehavior = () => {
  const reduce = typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return reduce ? 'instant' : 'smooth';
};

/** "#trending" -> the element with id="trending" (null when absent or malformed). */
export const findHashTarget = (hash) => {
  if (!hash || hash === '#') return null;
  let id = hash.slice(1);
  try { id = decodeURIComponent(id); } catch (err) { /* keep the raw id */ }
  return document.getElementById(id);
};

const HASH_WAIT_MS = 5000;   // sections behind an API call can take a moment to appear
const POLL_MS = 100;
const TOP_FIRST_MS = 300;    // if the section isn't there yet, show the page top meanwhile
const SETTLE_CHECKS_MS = [450, 1100]; // re-align if images/data above the target shift it

/**
 * Scroll handling for client-side navigation (BrowserRouter does not do any):
 *  - a new page (link, search, redirect) starts at the top, smoothly;
 *  - a URL with a #hash smooth-scrolls to that element once it exists (async content
 *    is waited for briefly); the offset for the fixed navbar is scroll-margin-top in CSS;
 *  - clicking a link to the page or section you are already on scrolls there again;
 *  - browser back/forward (POP) is left alone so the browser restores the old position,
 *    except on the first load, where a #hash in the address is honoured.
 * Navigations can opt out with navigate(to, { state: { preventScroll: true } }).
 */
const ScrollManager = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const firstRender = useRef(true);

  // Let the browser restore positions on back/forward, which is the POP behaviour we want
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'auto';
  }, []);

  useEffect(() => {
    const isFirst = firstRender.current;
    firstRender.current = false;

    if (location.state?.preventScroll) return undefined;
    if (navigationType === 'POP' && !(isFirst && location.hash)) return undefined;
    if (isFirst && !location.hash) return undefined; // fresh load already starts at the top

    const timers = [];
    let frame = 0;
    let cancelled = false;

    // Any manual scroll input from the reader cancels the pending/settling scroll
    const cancel = () => { cancelled = true; };
    const inputEvents = ['wheel', 'touchstart', 'keydown'];
    inputEvents.forEach(ev => window.addEventListener(ev, cancel, { passive: true }));

    const run = () => {
      if (!location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: scrollBehavior() });
        return;
      }
      const started = Date.now();
      let movedToTop = false;
      const tryScroll = () => {
        if (cancelled) return;
        const el = findHashTarget(location.hash);
        if (el) {
          el.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
          // Content above the section (cover images, other API data) can still push it down
          SETTLE_CHECKS_MS.forEach(ms => timers.push(setTimeout(() => {
            if (cancelled || !el.isConnected) return;
            const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
            if (Math.abs(el.getBoundingClientRect().top - margin) > 24) {
              el.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
            }
          }, ms)));
          return;
        }
        const waited = Date.now() - started;
        if (!movedToTop && waited >= TOP_FIRST_MS && navigationType !== 'POP') {
          movedToTop = true;
          window.scrollTo({ top: 0, left: 0, behavior: scrollBehavior() });
        }
        if (waited < HASH_WAIT_MS) {
          timers.push(setTimeout(tryScroll, POLL_MS));
        }
        // The section never appeared (e.g. no articles yet): the page stays at its top
      };
      tryScroll();
    };

    // Wait a frame so the new route has painted and an open mobile menu has closed
    // (and released its scroll lock) before scrolling.
    frame = window.requestAnimationFrame(run);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      inputEvents.forEach(ev => window.removeEventListener(ev, cancel));
    };
    // location.key changes on every navigation, including a click on the current page's link
  }, [location.key, location.pathname, location.search, location.hash, location.state, navigationType]);

  return null;
};

export default ScrollManager;
